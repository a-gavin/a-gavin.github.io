+++
title = "BitMagic Logic Analyzer PulseView Setup on Linux"
date = "2022-09-01"
description = ""
path = "blog/linux-pulseview-bitmagic"

#[taxonomies]
#tags = ["linux", "embedded", "pulseview", "1bitsquared"]
+++

## Overview

This quick guide details how to install and configure the PulseView logic analyzer software on Linux for use with the 1BitSquared [BitMagic Basic](https://1bitsquared.com/products/bitmagic-basic).

_This guide targets Ubuntu and Fedora, but similar concepts will apply to other distributions._

## Instructions

**NOTE:** This guide assumes you have root access to the machine you'll use.

1. **Install PulseView**

   To install PulseView for use with the BitMagic, install both PulseView and the Sigrok fx2lafw firmware (see [this issue](https://sigrok.org/bugzilla/show_bug.cgi?id=1312) for more information).

   - Ubuntu: `sudo apt install pulseview sigrok-firmware-fx2lafw`
   - Fedora: `sudo dnf install pulseview sigrok-firmware-fx2lafw`

2. **Add BitMagic udev rule**

   _This step permits you to run PulseView as a non-root user._

   Place the below text into a text file in the `/etc/udev/rules.d/` directory. I recommend the name `99-bitmagic.rules`, which will process near the end of all udev rules. See the end of this step for more information.

   ```
   # BitMagic Basic Logic Analyzer
   ATTRS{idVendor}=="1d50", ATTRS{idProduct}=="0004", MODE="0666"
   ```

   A quick note on udev, **the name of the udev rule file matters**. Udev processes rules in lexically sorted order. As all installed rules on the system (including the ones provided by your distribution) are sorted and processed together, **it's essential to name the udev rule file with a name like `99-bitmagic.rule`**. Doing so ensures that the BitMagic rule will not conflict with other system rules.
   
   **UPDATE:** For more information on udev rule creation and documentation, see [another post](@/blog/2022-12-linux-usb-serial.md) I wrote which details udev rule creation (specifically targeted at USB serial devices).

3. **Reload and re-apply udev rules**

   Run the following command to load and make active your newly-created udev rule.

   ```Bash
   sudo udevadm control --reload-rules && sudo udevadm trigger
   ```

4. **Connect the BitMagic device to a USB port on your machine**

5. **Run PulseView and select BitMagic Device**

   In the "Connect to Device" popup GUI in a PulseView session, choose the `fx2lafw` driver via USB. PulseView should then autodetect the BitMagic device as `sigrok FX2 LA (8ch) with 8 channels` or similar.

6. **Select your desired decoder and begin sampling!**

   _Don't forget to set your sample rate [at least four times faster](https://support.saleae.com/faq/technical-faq/what-sample-rate-is-required) than the signal you're sampling!_
