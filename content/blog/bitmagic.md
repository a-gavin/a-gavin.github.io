+++
title = "PulseView BitMagic Logic Analyzer Setup on Linux"
date = "2022-09-01"
description = ""

#[taxonomies]
#tags = ["linux", "embedded", "pulseview", "1bitsquared"]
+++

## Overview

**NOTE:** This guide assumes you have root access to the machine you're using.

This is a quick guide which details how to install PulseView logic analyzer software on Linux and configure it to use the 1BitSquared [BitMagic Basic](https://1bitsquared.com/products/bitmagic-basic). This guide targets Ubuntu and Fedora, but similar concepts will apply to other distributions.

## Instructions

1. Install PulseView:

- Ubuntu: `sudo apt install pulseview`
- Fedora: `sudo dnf install pulseview`

2. Install Sigrok fx2lafw firmware (see [this issue](https://sigrok.org/bugzilla/show_bug.cgi?id=1312)):

- Ubuntu: `sudo apt install sigrok-firmware-fx2lafw`
- Fedora: `sudo dnf install sigrok-firmware-fx2lafw`

3. Add udev rule:

**UPDATE:** If you're unfamiliar with udev, I wrote [another post](@/blog/usb-serial.md) which details the process (specifically targeted at USB serial devices). The tl;dr is you will need to run PulseView as root unless you perform this step.

Place the following in a file like `/etc/udev/rules.d/99-bitmagic.rules` (the number prefix matters).

```
# BitMagic Basic Logic Analyzer
ATTRS{idVendor}=="1d50", ATTRS{idProduct}=="0004", MODE="0666"
```

Then run the following command to load your newly-created udev rule and apply it to the BitMagic.

```Bash
sudo udevadm control --reload-rules && sudo udevadm trigger
```

4. Connect the BitMagic device to a USB port on your machine using a USB-C to USB-A cable.

5. Run PulseView. In "Connect to Device", choose the `fx2lafw` driver via USB. It should autodetect the BitMagic device as `sigrok FX2 LA (8ch) with 8 channels` or similar.

6. Once selected, select your desired decoder (e.g. SPI) and begin sampling!

   **NOTE:** Don't forget to set your sample rate [at least four times faster](https://support.saleae.com/faq/technical-faq/what-sample-rate-is-required) than the signal you're sampling!
