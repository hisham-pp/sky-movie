{
  "targets": [
    {
      "target_name": "mpv_player",
      "sources": ["src/mpv_player.cc"],
      "include_dirs": [
        "<!@(node -p \"require('node-addon-api').include\")",
        "include"
      ],
      "defines": ["NAPI_DISABLE_CPP_EXCEPTIONS"],
      "conditions": [
        ["OS=='win'", {
          "libraries": ["<(module_root_dir)/lib/mpv.lib"],
          "copies": [{
            "destination": "<(PRODUCT_DIR)",
            "files": ["<(module_root_dir)/lib/mpv-2.dll"]
          }],
          "msvs_settings": {
            "VCCLCompilerTool": {
              "ExceptionHandling": 0,
              "AdditionalOptions": ["/std:c++17"]
            }
          }
        }],
        ["OS=='linux'", {
          "libraries": ["-lmpv"],
          "cflags_cc": ["-std=c++17"]
        }],
        ["OS=='mac'", {
          "libraries": ["-lmpv"],
          "include_dirs+": [
            "/opt/homebrew/include",
            "/usr/local/include"
          ],
          "library_dirs": [
            "/opt/homebrew/lib",
            "/usr/local/lib"
          ],
          "xcode_settings": {
            "OTHER_CPLUSPLUSFLAGS": ["-std=c++17"],
            "MACOSX_DEPLOYMENT_TARGET": "11.0"
          }
        }]
      ]
    }
  ]
}
