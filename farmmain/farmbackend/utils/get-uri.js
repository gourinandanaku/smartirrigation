const https = require('https');
const fs = require('fs');

async function go() {
  const fetchDns = (name, type) => new Promise(res => {
    https.get(`https://cloudflare-dns.com/dns-query?name=${name}&type=${type}`, {
      headers: { accept: 'application/dns-json' }
    }, r => {
      let body = '';
      r.on('data', d => body += d);
      r.on('end', () => res(JSON.parse(body)));
    });
  });

  try {
    const [srv, txt] = await Promise.all([
      fetchDns('_mongodb._tcp.cluster0.dypnqbb.mongodb.net', 'SRV'),
      fetchDns('cluster0.dypnqbb.mongodb.net', 'TXT')
    ]);

    const hosts = srv.Answer.map(a => {
      const parts = a.data.split(' ');
      let host = parts[3];
      if (host.endsWith('.')) host = host.slice(0, -1);
      return `${host}:${parts[2]}`;
    }).join(',');

    const options = txt.Answer.map(a => {
        let str = a.data;
        if (str.startsWith('"')) str = str.slice(1, -1);
        return str;
    }).join('&');

    const uri = `mongodb://user:user@${hosts}/smartag?ssl=true&${options}&retryWrites=true&w=majority`;
    fs.writeFileSync('mongo-uri.txt', uri);
    console.log('URI generated.');
  } catch(e) {
    console.error(e);
  }
}
go();
