# aidoku-serve
Host your sources in a source list for testing.  
Installation:
```
npm i -g aidoku-serve
```
Usage:  
```
aidoku-serve [options] <foo.aix>...
  options:
    -p, --port <port>        The port to host the source list on, default 3000
    -o, --output <outdir>    The directory to output the files to, default ./out/
```
The CLI will output a list of IPs (usually 2) that your list is being hosted on. These are simply the internal IPV4 addresses of your machine. Make sure you are not using a VPN and that your device is connected to the same Wi-Fi network.  

Add the source list to Aidoku through the `Source Lists` menu in the settings. Type the IP exactly how you see it in the terminal window. The IP you want to use will normally be the second one on the list.

Created by `JimIsWayTooEpic#0001` on Discord.
