# Homebridge Air Conditioner with ANAVI  -anavi-infrared-aircon

[Homebridge](https://github.com/nfarina/homebridge) plugin that uses [ANAVI Infrared](http://anavi.technology/#products) to drive a air conditioner with a simple power/up/down remote.

## Prerequisites

- Install packages. For Raspbian Stretch:

```shell
# apt install nodejs-legacy npm lirc i2c-tools libavahi-compat-libdnssd-dev
```

- Enable I2C.
- Enable LIRC module overlay.
- Update `/etc/lirc/lirc_options.conf` and `/etc/lirc/hardware.conf`.
- Reboot
- Create LIRC configuration.

### Further reading

- [“Setting Up LIRC on the RaspberryPi”](http://alexba.in/blog/2013/01/06/setting-up-lirc-on-the-raspberrypi/)
- [“LIRC - Configuration guide”](http://www.lirc.org/html/configuration-guide.html)
- [“LIRC - `irrecord` manual”](http://www.lirc.org/html/irrecord.html)

## Installation

```shell
# npm install -g homebridge homebriage-anavi-infrared-aircon
```

Update your configuration file to include a `aircon-ir-remote` accessory. See an example at `sample-config.json`.

## Persistent Installation

See [“Running Homebridge on Bootup”](https://github.com/nfarina/homebridge/wiki/Running-Homebridge-on-a-Raspberry-Pi#running-homebridge-on-bootup-systemd).

In condensed form, start with this [gist](https://gist.github.com/johannrichard/0ad0de1feb6adb9eb61a/) and then:

```shell
# mkdir /var/lib/homebridge
# useradd --system homebridge
# usermod -a -G i2c homebridge
# systemctl daemon-reload
# systemctl enable homebridge
# systemctl start homebridge
$ systemctl status homebridge
```
