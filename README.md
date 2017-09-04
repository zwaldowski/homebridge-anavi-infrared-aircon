# Homebridge Air Conditioner with ANAVI Infrared

[Homebridge](https://github.com/nfarina/homebridge) plugin that uses [ANAVI Infrared](http://anavi.technology/#products) to drive a “dumb” air conditioner with a unidirectional remote with power, up, and down commands.

The plugin was designed and tested on 

## Prerequisites

- Enable I2C.
- Enable LIRC module overlay.
- Update `/etc/lirc/lirc_options.conf` and `/etc/lirc/hardware.conf` for the hardware.
- Reboot.
- Install packages. For Raspbian Stretch:

```shell
# apt install nodejs-legacy npm lirc i2c-tools libavahi-compat-libdnssd-dev
```

- Create LIRC configuration.
- Install [Homebridge](https://github.com/nfarina/homebridge#installation).

### Further reading

- [“Setting Up LIRC on the RaspberryPi”](http://alexba.in/blog/2013/01/06/setting-up-lirc-on-the-raspberrypi/)
- [“LIRC - Configuration guide”](http://www.lirc.org/html/configuration-guide.html)
- [“LIRC - `irrecord` manual”](http://www.lirc.org/html/irrecord.html)

## Installation

```shell
# npm install -g homebridge homebriage-anavi-infrared-aircon
```

Update your configuration to include a `aircon-ir-remote` accessory. See an example at [`sample-config.json`](https://github.com/zwaldowski/homebridge-anavi-infrared-aircon/blob/master/config-sample.json).

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
