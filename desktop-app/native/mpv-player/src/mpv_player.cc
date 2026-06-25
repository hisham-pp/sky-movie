/**
 * libmpv N-API addon for Sky Movie
 *
 * Architecture (v2 — background render thread):
 *
 *   mpv internal thread
 *     └─ render-update callback → sets render_requested_, wakes render_thread_
 *
 *   render_thread_  (C++ background)
 *     └─ mpv_render_context_render() → copies RGBA into render_copy
 *     └─ frame_tsfn_.NonBlockingCall(buf, w, h)
 *
 *   JS main thread  (Node.js event loop)
 *     └─ receives (Buffer, width, height) via TSFN
 *     └─ nativeImage.toJPEG() → webContents.send()   ← only light work here
 *
 *  Result: the JS main thread is NEVER blocked by mpv rendering.
 */

#include <napi.h>
#include <mpv/client.h>
#include <mpv/render.h>

#include <atomic>
#include <condition_variable>
#include <cstring>
#include <mutex>
#include <string>
#include <thread>
#include <vector>
#include <memory>
#include <cstdio>

// ── MpvPlayer ────────────────────────────────────────────────────────────────

class MpvPlayer : public Napi::ObjectWrap<MpvPlayer> {
 public:
  static Napi::Object Init(Napi::Env env, Napi::Object exports) {
    Napi::Function func = DefineClass(env, "MpvPlayer", {
      InstanceMethod("loadFile",        &MpvPlayer::LoadFile),
      InstanceMethod("play",            &MpvPlayer::Play),
      InstanceMethod("pause",           &MpvPlayer::Pause),
      InstanceMethod("stop",            &MpvPlayer::Stop),
      InstanceMethod("seek",            &MpvPlayer::Seek),
      InstanceMethod("setVolume",       &MpvPlayer::SetVolume),
      InstanceMethod("setAudioTrack",   &MpvPlayer::SetAudioTrack),
      InstanceMethod("setSubTrack",     &MpvPlayer::SetSubTrack),
      InstanceMethod("setSpeed",        &MpvPlayer::SetSpeed),
      InstanceMethod("setProperty",     &MpvPlayer::SetProperty),
      InstanceMethod("getProperty",     &MpvPlayer::GetProperty),
      InstanceMethod("observeProperty", &MpvPlayer::ObserveProperty),
      InstanceMethod("resize",          &MpvPlayer::Resize),
      InstanceMethod("destroy",         &MpvPlayer::Destroy),
    });
    exports.Set("MpvPlayer", func);
    return exports;
  }

  MpvPlayer(const Napi::CallbackInfo& info) : Napi::ObjectWrap<MpvPlayer>(info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsObject()) {
      Napi::TypeError::New(env, "options object required").ThrowAsJavaScriptException();
      return;
    }

    Napi::Object opts = info[0].As<Napi::Object>();
    width_  = opts.Has("width")  ? opts.Get("width").As<Napi::Number>().Int32Value()  : 1280;
    height_ = opts.Has("height") ? opts.Get("height").As<Napi::Number>().Int32Value() : 720;

    fprintf(stderr, "[mpv_player] constructor: %dx%d\n", width_, height_);

    if (opts.Has("onEvent") && opts.Get("onEvent").IsFunction()) {
      event_tsfn_ = Napi::ThreadSafeFunction::New(
        env, opts.Get("onEvent").As<Napi::Function>(),
        "mpv:event", 0, 1, [](Napi::Env) {}
      );
    }

    if (opts.Has("onFrameReady") && opts.Get("onFrameReady").IsFunction()) {
      frame_tsfn_ = Napi::ThreadSafeFunction::New(
        env, opts.Get("onFrameReady").As<Napi::Function>(),
        "mpv:frame", 0, 1, [](Napi::Env) {}
      );
    }

    InitMpv();
  }

  ~MpvPlayer() { Teardown(); }

 private:
  // ── mpv handles ─────────────────────────────────────────────────────────────
  mpv_handle*         handle_     = nullptr;
  mpv_render_context* render_ctx_ = nullptr;

  // ── render dimensions (protected by size_mutex_) ─────────────────────────
  int         width_  = 1280;
  int         height_ = 720;
  std::mutex  size_mutex_;

  // ── frame buffer (protected by buf_mutex_) ───────────────────────────────
  std::vector<uint8_t> frame_buf_;
  std::mutex           buf_mutex_;

  // ── threads ──────────────────────────────────────────────────────────────
  std::thread event_thread_;
  std::thread render_thread_;

  // ── render-request signal (mpv update callback → render thread) ──────────
  std::mutex              render_trigger_mutex_;
  std::condition_variable render_cv_;
  bool                    render_requested_ = false;

  // ── lifecycle ────────────────────────────────────────────────────────────
  std::atomic<bool> running_   {false};
  bool              destroyed_ = false;

  // ── TSFNs ────────────────────────────────────────────────────────────────
  Napi::ThreadSafeFunction event_tsfn_;
  Napi::ThreadSafeFunction frame_tsfn_;

  // ── init ─────────────────────────────────────────────────────────────────

  void InitMpv() {
    fprintf(stderr, "[mpv_player] InitMpv start\n");

    handle_ = mpv_create();
    if (!handle_) {
      fprintf(stderr, "[mpv_player] mpv_create() failed\n");
      return;
    }

    mpv_set_option_string(handle_, "vo",           "libmpv");
    mpv_set_option_string(handle_, "hwdec",        "no");
    mpv_set_option_string(handle_, "audio-display","no");
    mpv_set_option_string(handle_, "idle",         "yes");
    mpv_set_option_string(handle_, "keep-open",    "yes");

    // Platform audio drivers
#if defined(_WIN32)
    mpv_set_option_string(handle_, "ao", "wasapi,dsound,audio");
    fprintf(stderr, "[mpv_player] audio: wasapi,dsound,audio\n");
#elif defined(__APPLE__)
    mpv_set_option_string(handle_, "ao", "coreaudio,openal");
#else
    mpv_set_option_string(handle_, "ao", "pulse,pipewire,alsa,oss");
#endif
    mpv_set_option_string(handle_, "audio-channels",         "stereo");
    mpv_set_option_string(handle_, "audio-normalize-downmix","yes");

    mpv_observe_property(handle_, 0, "time-pos",    MPV_FORMAT_DOUBLE);
    mpv_observe_property(handle_, 0, "duration",    MPV_FORMAT_DOUBLE);
    mpv_observe_property(handle_, 0, "pause",       MPV_FORMAT_FLAG);
    mpv_observe_property(handle_, 0, "volume",      MPV_FORMAT_DOUBLE);
    mpv_observe_property(handle_, 0, "track-list",  MPV_FORMAT_NODE);
    mpv_observe_property(handle_, 0, "eof-reached", MPV_FORMAT_FLAG);
    mpv_observe_property(handle_, 0, "media-title", MPV_FORMAT_STRING);

    int rc = mpv_initialize(handle_);
    if (rc < 0) {
      fprintf(stderr, "[mpv_player] mpv_initialize() failed: %s\n", mpv_error_string(rc));
      mpv_destroy(handle_);
      handle_ = nullptr;
      return;
    }
    fprintf(stderr, "[mpv_player] mpv_initialize() OK\n");

    // SW render context
    mpv_render_param params[] = {
      {MPV_RENDER_PARAM_API_TYPE, (void*)MPV_RENDER_API_TYPE_SW},
      {MPV_RENDER_PARAM_INVALID,  nullptr}
    };
    rc = mpv_render_context_create(&render_ctx_, handle_, params);
    if (rc < 0) {
      fprintf(stderr, "[mpv_player] mpv_render_context_create() failed: %s\n", mpv_error_string(rc));
      render_ctx_ = nullptr;
    } else {
      fprintf(stderr, "[mpv_player] render context created (SW)\n");

      // Update callback signals the render thread, NOT the JS main thread.
      // This keeps mpv_render_context_render() off the Node.js event loop.
      mpv_render_context_set_update_callback(render_ctx_,
        [](void* ctx) {
          auto* self = static_cast<MpvPlayer*>(ctx);
          if (!self->running_) return;
          {
            std::lock_guard<std::mutex> lk(self->render_trigger_mutex_);
            self->render_requested_ = true;
          }
          self->render_cv_.notify_one();
        },
        this
      );
    }

    // Pre-allocate frame buffer
    {
      std::lock_guard<std::mutex> lk(buf_mutex_);
      frame_buf_.assign((size_t)width_ * height_ * 4, 0);
    }

    running_ = true;
    event_thread_  = std::thread(&MpvPlayer::EventLoop,  this);
    render_thread_ = std::thread(&MpvPlayer::RenderLoop, this);

    fprintf(stderr, "[mpv_player] InitMpv done, threads started\n");
  }

  // ── render loop (background C++ thread) ──────────────────────────────────

  void RenderLoop() {
    fprintf(stderr, "[mpv_player] RenderLoop started\n");
    size_t frames_rendered = 0;

    while (running_) {
      // Wait until mpv signals a new frame is ready
      std::unique_lock<std::mutex> lk(render_trigger_mutex_);
      render_cv_.wait(lk, [this] { return render_requested_ || !running_; });
      if (!running_) break;
      render_requested_ = false;
      lk.unlock();

      if (!render_ctx_) continue;

      // Read current dimensions (may have changed via Resize())
      int w, h;
      {
        std::lock_guard<std::mutex> sz_lk(size_mutex_);
        w = width_; h = height_;
      }
      if (w <= 0 || h <= 0) continue;

      // Render into frame_buf_
      {
        std::lock_guard<std::mutex> buf_lk(buf_mutex_);
        size_t needed = (size_t)w * h * 4;
        if (frame_buf_.size() != needed) {
          frame_buf_.assign(needed, 0);
          fprintf(stderr, "[mpv_player] RenderLoop: buffer resized to %dx%d\n", w, h);
        }

        int sw_size[2]  = {w, h};
        const char* fmt = "bgra";
        size_t stride   = (size_t)w * 4;
        void*  ptr      = frame_buf_.data();

        mpv_render_param rp[] = {
          {MPV_RENDER_PARAM_SW_SIZE,    sw_size},
          {MPV_RENDER_PARAM_SW_FORMAT,  (void*)fmt},
          {MPV_RENDER_PARAM_SW_STRIDE,  &stride},
          {MPV_RENDER_PARAM_SW_POINTER, ptr},
          {MPV_RENDER_PARAM_INVALID,    nullptr}
        };

        int rc = mpv_render_context_render(render_ctx_, rp);
        if (rc < 0) continue;
      }

      frames_rendered++;
      if (frames_rendered % 300 == 0) {
        fprintf(stderr, "[mpv_player] RenderLoop: %zu frames rendered\n", frames_rendered);
      }

      // Copy the rendered buffer so the TSFN lambda can own it independently
      // (frame_buf_ may be modified on the next render iteration while the
      //  lambda is still queued in the TSFN queue waiting to run on the JS thread)
      auto render_copy = std::make_shared<std::vector<uint8_t>>();
      int fw = w, fh = h;
      {
        std::lock_guard<std::mutex> buf_lk(buf_mutex_);
        *render_copy = frame_buf_;   // copy
      }

      if (!frame_tsfn_ || !running_) continue;

      // Deliver pre-rendered RGBA buffer to the JS main thread.
      // The lambda captures render_copy (shared_ptr — stays alive until JS runs it).
      frame_tsfn_.NonBlockingCall(
        [render_copy, fw, fh](Napi::Env env, Napi::Function cb) {
          // This runs on the JS main thread; only a memcpy + JS Buffer alloc here.
          auto buf = Napi::Buffer<uint8_t>::Copy(env,
            render_copy->data(), render_copy->size());
          cb.Call({buf, Napi::Number::New(env, fw), Napi::Number::New(env, fh)});
        }
      );
    }

    fprintf(stderr, "[mpv_player] RenderLoop exiting (total frames: %zu)\n", frames_rendered);
  }

  // ── teardown ─────────────────────────────────────────────────────────────

  void Teardown() {
    if (destroyed_) return;
    destroyed_ = true;

    fprintf(stderr, "[mpv_player] Teardown start\n");

    // Step 0: Silence audio IMMEDIATELY.
    // Thread joins below (render_thread_ in particular) can block for
    // 100-300 ms while mpv_render_context_render() finishes a frame decode.
    // During that window mpv would keep driving the audio driver.  Issuing
    // "stop" and zeroing the volume here kills audio output before we even
    // touch the threads, making the switch-movie / refresh experience instant.
    if (handle_) {
      mpv_command_string(handle_, "stop");
      double zero = 0.0;
      mpv_set_property(handle_, "volume", MPV_FORMAT_DOUBLE, &zero);
      fprintf(stderr, "[mpv_player] Teardown: playback stopped, volume zeroed\n");
    }

    running_ = false;

    // 1. Stop the render thread FIRST — it owns mpv_render_context_render().
    //    Wake it so it exits the wait, then join.
    render_cv_.notify_all();
    if (render_thread_.joinable()) {
      render_thread_.join();
      fprintf(stderr, "[mpv_player] render_thread joined\n");
    }

    // 2. Free the render context.  The render thread is fully stopped so there
    //    are no concurrent calls to mpv_render_context_render() or the update
    //    callback.  This call is therefore non-blocking and safe.
    if (render_ctx_) {
      mpv_render_context_free(render_ctx_);
      render_ctx_ = nullptr;
      fprintf(stderr, "[mpv_player] render_ctx freed\n");
    }

    // 3. Stop the event loop thread.
    if (handle_) mpv_wakeup(handle_);
    if (event_thread_.joinable()) {
      event_thread_.join();
      fprintf(stderr, "[mpv_player] event_thread joined\n");
    }

    // 4. Release TSFNs — both producer threads are fully stopped.
    //    Any callbacks still in the TSFN queue will drain safely before the
    //    TSFN itself is freed.
    if (frame_tsfn_) { frame_tsfn_.Release(); }
    if (event_tsfn_) { event_tsfn_.Release(); }

    // 5. Destroy the mpv handle.
    if (handle_) {
      mpv_destroy(handle_);
      handle_ = nullptr;
    }

    fprintf(stderr, "[mpv_player] Teardown complete\n");
  }

  // ── event loop (background thread) ───────────────────────────────────────

  void EventLoop() {
    fprintf(stderr, "[mpv_player] EventLoop started\n");
    while (running_) {
      mpv_event* ev = mpv_wait_event(handle_, 0.5);
      if (!running_) break;
      if (ev->event_id == MPV_EVENT_SHUTDOWN) break;

      if (ev->event_id == MPV_EVENT_PROPERTY_CHANGE) {
        auto* prop = static_cast<mpv_event_property*>(ev->data);
        FirePropertyEvent(prop);
      } else if (ev->event_id == MPV_EVENT_END_FILE) {
        fprintf(stderr, "[mpv_player] event: end-file\n");
        FireSimpleEvent("end-file");
      } else if (ev->event_id == MPV_EVENT_START_FILE) {
        fprintf(stderr, "[mpv_player] event: start-file\n");
        FireSimpleEvent("start-file");
      } else if (ev->event_id == MPV_EVENT_FILE_LOADED) {
        fprintf(stderr, "[mpv_player] event: file-loaded\n");
        FireSimpleEvent("file-loaded");
      }
    }
    fprintf(stderr, "[mpv_player] EventLoop exiting\n");
  }

  // ── property / event helpers ──────────────────────────────────────────────

  struct PropertyPayload {
    std::string name;
    std::string type;
    double      num_val  = 0.0;
    bool        bool_val = false;
    std::string str_val;
  };

  void FirePropertyEvent(mpv_event_property* prop) {
    if (!event_tsfn_) return;
    auto payload = std::make_shared<PropertyPayload>();
    payload->name = prop->name;

    if (prop->format == MPV_FORMAT_DOUBLE && prop->data) {
      payload->type    = "double";
      payload->num_val = *static_cast<double*>(prop->data);
    } else if (prop->format == MPV_FORMAT_FLAG && prop->data) {
      payload->type     = "bool";
      payload->bool_val = (*static_cast<int*>(prop->data)) != 0;
    } else if (prop->format == MPV_FORMAT_STRING && prop->data) {
      payload->type    = "string";
      payload->str_val = *static_cast<char**>(prop->data);
    } else if (prop->format == MPV_FORMAT_NODE) {
      payload->type = "node";
    } else {
      payload->type = "null";
    }

    event_tsfn_.NonBlockingCall([payload](Napi::Env env, Napi::Function cb) {
      Napi::Object obj = Napi::Object::New(env);
      obj.Set("type", Napi::String::New(env, "property"));
      obj.Set("name", Napi::String::New(env, payload->name));
      if (payload->type == "double") {
        obj.Set("value", Napi::Number::New(env, payload->num_val));
      } else if (payload->type == "bool") {
        obj.Set("value", Napi::Boolean::New(env, payload->bool_val));
      } else if (payload->type == "string") {
        obj.Set("value", Napi::String::New(env, payload->str_val));
      } else {
        obj.Set("value", env.Null());
      }
      cb.Call({obj});
    });
  }

  void FireSimpleEvent(const std::string& name) {
    if (!event_tsfn_) return;
    event_tsfn_.NonBlockingCall([name](Napi::Env env, Napi::Function cb) {
      Napi::Object obj = Napi::Object::New(env);
      obj.Set("type", Napi::String::New(env, name));
      cb.Call({obj});
    });
  }

  // ── JS-exposed methods ────────────────────────────────────────────────────

  Napi::Value LoadFile(const Napi::CallbackInfo& info) {
    if (!handle_ || info.Length() < 1) return info.Env().Undefined();
    std::string path = info[0].As<Napi::String>().Utf8Value();
    fprintf(stderr, "[mpv_player] LoadFile: %s\n", path.c_str());
    const char* cmd[] = {"loadfile", path.c_str(), nullptr};
    int rc = mpv_command(handle_, cmd);
    if (rc < 0) fprintf(stderr, "[mpv_player] LoadFile error: %s\n", mpv_error_string(rc));
    return info.Env().Undefined();
  }

  Napi::Value Play(const Napi::CallbackInfo& info) {
    if (!handle_) return info.Env().Undefined();
    fprintf(stderr, "[mpv_player] Play\n");
    int flag = 0;
    mpv_set_property(handle_, "pause", MPV_FORMAT_FLAG, &flag);
    return info.Env().Undefined();
  }

  Napi::Value Pause(const Napi::CallbackInfo& info) {
    if (!handle_) return info.Env().Undefined();
    fprintf(stderr, "[mpv_player] Pause\n");
    int flag = 1;
    mpv_set_property(handle_, "pause", MPV_FORMAT_FLAG, &flag);
    return info.Env().Undefined();
  }

  Napi::Value Stop(const Napi::CallbackInfo& info) {
    if (!handle_) return info.Env().Undefined();
    fprintf(stderr, "[mpv_player] Stop\n");
    mpv_command_string(handle_, "stop");
    return info.Env().Undefined();
  }

  Napi::Value Seek(const Napi::CallbackInfo& info) {
    if (!handle_ || info.Length() < 1) return info.Env().Undefined();
    double secs = info[0].As<Napi::Number>().DoubleValue();
    std::string secs_str = std::to_string(secs);
    const char* cmd[] = {"seek", secs_str.c_str(), "absolute", nullptr};
    mpv_command(handle_, cmd);
    return info.Env().Undefined();
  }

  Napi::Value SetVolume(const Napi::CallbackInfo& info) {
    if (!handle_ || info.Length() < 1) return info.Env().Undefined();
    double vol = info[0].As<Napi::Number>().DoubleValue();
    mpv_set_property(handle_, "volume", MPV_FORMAT_DOUBLE, &vol);
    return info.Env().Undefined();
  }

  Napi::Value SetAudioTrack(const Napi::CallbackInfo& info) {
    if (!handle_ || info.Length() < 1) return info.Env().Undefined();
    int64_t idx = info[0].As<Napi::Number>().Int64Value();
    mpv_set_property(handle_, "aid", MPV_FORMAT_INT64, &idx);
    return info.Env().Undefined();
  }

  Napi::Value SetSubTrack(const Napi::CallbackInfo& info) {
    if (!handle_ || info.Length() < 1) return info.Env().Undefined();
    if (info[0].IsNumber()) {
      int64_t idx = info[0].As<Napi::Number>().Int64Value();
      if (idx == 0) {
        mpv_set_property_string(handle_, "sid", "no");
      } else {
        mpv_set_property(handle_, "sid", MPV_FORMAT_INT64, &idx);
      }
    }
    return info.Env().Undefined();
  }

  Napi::Value SetSpeed(const Napi::CallbackInfo& info) {
    if (!handle_ || info.Length() < 1) return info.Env().Undefined();
    double speed = info[0].As<Napi::Number>().DoubleValue();
    mpv_set_property(handle_, "speed", MPV_FORMAT_DOUBLE, &speed);
    return info.Env().Undefined();
  }

  Napi::Value SetProperty(const Napi::CallbackInfo& info) {
    if (!handle_ || info.Length() < 2) return info.Env().Undefined();
    std::string name = info[0].As<Napi::String>().Utf8Value();
    if (info[1].IsNumber()) {
      double val = info[1].As<Napi::Number>().DoubleValue();
      mpv_set_property(handle_, name.c_str(), MPV_FORMAT_DOUBLE, &val);
    } else if (info[1].IsBoolean()) {
      int val = info[1].As<Napi::Boolean>().Value() ? 1 : 0;
      mpv_set_property(handle_, name.c_str(), MPV_FORMAT_FLAG, &val);
    } else if (info[1].IsString()) {
      std::string val = info[1].As<Napi::String>().Utf8Value();
      mpv_set_property_string(handle_, name.c_str(), val.c_str());
    }
    return info.Env().Undefined();
  }

  Napi::Value GetProperty(const Napi::CallbackInfo& info) {
    Napi::Env env = info.Env();
    if (!handle_ || info.Length() < 1) return env.Null();
    std::string name = info[0].As<Napi::String>().Utf8Value();
    double dval;
    if (mpv_get_property(handle_, name.c_str(), MPV_FORMAT_DOUBLE, &dval) >= 0)
      return Napi::Number::New(env, dval);
    char* sval = mpv_get_property_string(handle_, name.c_str());
    if (sval) {
      Napi::String result = Napi::String::New(env, sval);
      mpv_free(sval);
      return result;
    }
    return env.Null();
  }

  Napi::Value ObserveProperty(const Napi::CallbackInfo& info) {
    return info.Env().Undefined();
  }

  // Resize: update the render dimensions; render thread picks them up next frame.
  Napi::Value Resize(const Napi::CallbackInfo& info) {
    if (info.Length() >= 2 && info[0].IsNumber() && info[1].IsNumber()) {
      int w = info[0].As<Napi::Number>().Int32Value();
      int h = info[1].As<Napi::Number>().Int32Value();
      if (w > 0 && h > 0) {
        std::lock_guard<std::mutex> sz_lk(size_mutex_);
        if (w != width_ || h != height_) {
          fprintf(stderr, "[mpv_player] Resize: %dx%d\n", w, h);
          width_ = w; height_ = h;
        }
      }
    }
    return info.Env().Undefined();
  }

  Napi::Value Destroy(const Napi::CallbackInfo& info) {
    fprintf(stderr, "[mpv_player] Destroy called from JS\n");
    Teardown();
    return info.Env().Undefined();
  }
};

// ── Module entry point ───────────────────────────────────────────────────────

Napi::Object ModuleInit(Napi::Env env, Napi::Object exports) {
  return MpvPlayer::Init(env, exports);
}

NODE_API_MODULE(mpv_player, ModuleInit)
