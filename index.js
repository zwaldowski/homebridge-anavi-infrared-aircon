'use strict'

const plugin = require('./package')
var Service, Characteristic

module.exports = function(homebridge) {
    Service = homebridge.hap.Service
    Characteristic = homebridge.hap.Characteristic
    homebridge.registerAccessory(plugin.name, "aircon-ir-remote", AirConAccessory)
}

class AirConAccessory {

  constructor (log, config) {
    this.log = log
    this.informationService = this.makeInformationService(config)
    this.thermostatService = this.makeThermostatService(config)
  }

  identify (callback) {
    this.log('Device identified!')
    callback()
  }

  makeInformationService(config) {
    const service = new Service.AccessoryInformation()

    service
      .setCharacteristic(Characteristic.Manufacturer, config.device.manufacturer)
      .setCharacteristic(Characteristic.Model, config.device.model)
      .setCharacteristic(Characteristic.SerialNumber, config.device.serial)
      .setCharacteristic(Characteristic.FirmwareRevision, config.device.revision || plugin.version)

    return service
  }

  getTemperatureDisplayUnits (callback) {
    callback(null, this.temperatureDisplayUnits)
  }

  setTemperatureDisplayUnits (value, callback) {
    this.log("Temperature display unit to %s.", value)
    this.temperatureDisplayUnits = value
    callback(null, this.temperatureDisplayUnits)
  }

  getCurrentTemperature (callback) {
    this.sensor.readTemperature(function(tempInC) {
      callback(null, tempInC)
    })
  }

  getCurrentRelativeHumidity (callback) {
    this.sensor.readHumidity(function(relativeHumidity) {
      callback(null, relativeHumidity)
    })
  }

  getCurrentHeatingCoolingState (callback) {
    callback(null, this.heatingCoolingState)
  }

  setTargetHeatingCoolingState (callback) {
    this.log('Power state to %s.', value)

    if ((value !== Characteristic.TargetHeatingCoolingState.OFF) && (this.heatingCoolingState === Characteristic.TargetHeatingCoolingState.OFF)) {
      this.heatingCoolingState = Characteristic.TargetHeatingCoolingState.COOL
      this.remoteSend('KEY_POWER', function() {
        callback(null, Characteristic.TargetHeatingCoolingState.COOL)
      })
    } else if ((value === Characteristic.TargetHeatingCoolingState.OFF) && (this.heatingCoolingState !== Characteristic.TargetHeatingCoolingState.OFF)) {
      this.heatingCoolingState = Characteristic.TargetHeatingCoolingState.OFF
      this.remoteSend('KEY_POWER', function() {
        callback(null, Characteristic.TargetHeatingCoolingState.OFF)
      })
    } else {
      callback()
    }
  }

  fahrenheitToCelsius (temperature) {
    return (temperature - 32) / 1.8
  }

  celsiusToFahrenheit(temperature) {
    return (temperature * 1.8) + 32
  }

  getTargetTemperature (callback) {
    callback(null, this.currentSetpoint)
  }

  setTargetTemperature (_newValue, callback) {
    const oldValue = this.celsiusToDevice(this.currentSetpoint),
      newValue = this.celsiusToDevice(_newValue)

    this.currentSetpoint = newValue

    this.log('Set temperature to %s (from %s).', newValue, oldValue)

    this.thermostatService
      .getCharacteristic(Characteristic.TargetHeatingCoolingState)
      .setValue(Characteristic.TargetHeatingCoolingState.COOL, function(error) {
        if (error) {
          callback(error)
          return
        }

        function handleNext(command, stepsRemaining) {
          if (stepsRemaining <= 0) {
            callback()
            return
          }

          this.remoteSend(command, function() {
            handleNext(command, stepsRemaining - 1)
          })
        }

        if (oldValue < newValue) {
          handleNext('BTN_GEAR_UP', newValue - oldValue)
        } else if (oldValue > newValue) {
          handleNext('BTN_GEAR_DOWN', oldValue - newValue)
        } else {
          callback()
        }
      })
  }

  makeThermostatService(config) {
    const service = new Service.Thermostat(config.name)

    switch (config.unit) {
    case "fahrenheit":
      this.temperatureDisplayUnits = Characteristic.TemperatureDisplayUnits.FAHRENHEIT
      this.celsiusToDevice = function (temperature) {
        return Math.round(this.celsiusToFahrenheit(temperature))
      }
    default:
      this.temperatureDisplayUnits = Characteristic.TemperatureDisplayUnits.CELSIUS
      this.celsiusToDevice = function (temperature) {
        return Math.round(temperature * 2) / 2
      }
    }

    service
      .getCharacteristic(Characteristic.TemperatureDisplayUnits)
      .on('get', this.getTemperatureDisplayUnits.bind(this))
      .on('set', this.setTemperatureDisplayUnits.bind(this))

    if (typeof config.i2c === 'undefined') {
      throw new Error('Must specify I2C sensor configuration')
    }

    switch (config.i2c.kind) {
    case "htu21d":
      const i2c_htu21d = require('htu21d-i2c')
      this.sensor = new i2c_htu21d(config.sensor)

      service
        .getCharacteristic(Characteristic.CurrentRelativeHumidity)
        .on('get', this.getCurrentRelativeHumidity.bind(this))

      break
    case "dht22":
      const i2c_bmp085 = require('bmp085')
      this.sensor = new i2c_bmp085(config.sensor)

      break
    default:
      throw new Error('Unknown sensor kind')
    }

    service
      .getCharacteristic(Characteristic.CurrentTemperature)
      .on('get', this.getCurrentTemperature.bind(this))

    if (typeof config.ir !== 'undefined' && typeof config.ir.name !== 'undefined') {
      const lirc = require('lirc_node'),
        name = config.ir.name

      this.remoteSend = function(button, callback) {
        lirc.irsend.send_once(name, button, callback)
      }
    } else {
      throw new Error('Need device name for LIRC.')
    }

    this.heatingCoolingState = Characteristic.TargetHeatingCoolingState.OFF

    service
      .getCharacteristic(Characteristic.CurrentHeatingCoolingState)
      .on('get', this.getCurrentHeatingCoolingState.bind(this))

    service
      .getCharacteristic(Characteristic.TargetHeatingCoolingState)
      .setValue(this.heatingCoolingState)
      .on('set', this.setTargetHeatingCoolingState.bind(this))

    this.currentSetpoint = config.defaultSetpoint || 20

    service
      .getCharacteristic(Characteristic.TargetTemperature)
      .setProps({
        minValue: config.minSetpoint || 10,
        maxValue: config.maxSetpoint || 30,
        minStep: 0.5
      })
      .on('get', this.getTargetTemperature.bind(this))
      .on('set', this.setTargetTemperature.bind(this))

    return service
  }

  getServices () {
    return [ this.informationService, this.thermostatService ]
  }

}
