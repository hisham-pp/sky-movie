export const EXTRA_TRACKERS = [
  'udp://tracker.opentrackr.org:1337/announce',
  'udp://open.tracker.cl:1337/announce',
  'udp://tracker.openbittorrent.com:6969/announce',
  'udp://exodus.desync.com:2710/announce',
  'udp://tracker.torrent.eu.org:451/announce',
  'udp://tracker.tiny-vps.com:6969/announce',
  'udp://tracker.moeking.me:6969/announce',
  'udp://retracker.lanta-net.ru:2710/announce',
  'udp://9.rarbg.com:2810/announce',
  'udp://tracker.dler.org:6969/announce',
  'udp://open.stealth.si:80/announce',
  'udp://tracker.internetwarriors.net:1337/announce',
  'udp://tracker.zer0day.to:1337/announce',
  'udp://tracker.coppersurfer.tk:6969/announce',
  'udp://tracker.leechers-paradise.org:6969/announce',
  'udp://ipv4.tracker.harry.lu:80/announce',
  'udp://tracker.pirateparty.gr:6969/announce',
  'udp://tracker.cyberia.is:6969/announce',
  'udp://tracker.uw0.xyz:6969/announce',
  'udp://tracker.army:6969/announce',
  'https://tracker.nitrix.me:443/announce',
  'https://tracker.tamersunion.org:443/announce',
  'https://opentracker.i2p.rocks:443/announce',
  'https://tracker1.520.jp:443/announce',
  'wss://tracker.openwebtorrent.com',
  'wss://tracker.btorrent.xyz',
  'wss://tracker.webtorrent.dev',
];

export const EXTRA_TRACKERS_QUERY = EXTRA_TRACKERS
  .map((t) => `&tr=${encodeURIComponent(t)}`)
  .join('');
