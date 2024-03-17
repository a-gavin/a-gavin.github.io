+++
title = "Linux Non-Root USB Serial Permissions"
date = "2024-03-03"
description = "How to use udev rules to give non-root users access to a USB serial device."

#[taxonomies]
#tags = ["Linux", "udev", "USB"]
+++

## Motivation

If you're using a USB serial device like an FTDI USB UART serial converter on Linux,
only root can access the device by default. To allow users to use the USB serial device
_without being root_, you need to configure a udev rule for the device.

If you aren't familiar with udev, [this article]("https://wiki.archlinux.org/title/udev")
explains the basics and a bit of history. The main takeaway is that udev controls USB serial devices,
among other things. This necessitates the creating an appropriate udev rule to use the device as a non-root user.

**NOTE:** This assumes you have root privileges on the machine you will use and are fine with giving
_all users_ access to serial devices on the system.

## Instructions

### 1. Identify the device

Run `ls /dev/`. The device will show up as a `/dev/ttyACMx` or
`/dev/ttyUSBx`, where `x` is some positive number.

If there are multiple ACM and/or USB devices visible, unplug and re-plug in the USB device.
Then, search for the USB event in the kernel message buffer using command
`sudo dmesg | grep "usb"`. This should print out enough information
to identify the desired USB device's tty.

For example, see the last line of the output where it lists ttyUSB1:

```Bash
$ sudo dmesg | grep "usb"
[21.944277] usb 1-4: USB disconnect, device number 6
[21.637095] usb 1-4: new full-speed USB device number 7 using xhci_hcd
[21.764180] usb 1-4: New USB device found, idVendor=1a86, idProduct=7523, bcdDevice= 2.64
[21.764184] usb 1-4: New USB device strings: Mfr=0, Product=2, SerialNumber=0
[21.764186] usb 1-4: Product: USB Serial
[21.766670] usb 1-4: ch341-uart converter now attached to ttyUSB1
```

### 2. Get the device model ID and vendor ID

Search for the model and vendor ID using the `udevadm info` command.
For example, the following searches for the model and vendor ID of the `/dev/ttyUSB1` device.

```Bash
$ udevadm info /dev/ttyUSB1 | grep "ID_VENDOR_ID\|ID_MODEL_ID"
E: ID_VENDOR_ID=0403
E: ID_MODEL_ID=6015
```

### 3. Create the udev rule

As super user, create a new udev rule file in `/etc/udev/rules.d/`, for example
`80-usb-serial.rules`. Then add the below line, substituting in the model and vendor ID
you found in the previous step. Note that the number prefix of the file name matters.
It indicates priority when checking udev rules, the lower the higher.

```Bash
# Contents of udev rule
SUBSYSTEM=="tty", ENV{ID_VENDOR_ID}=="0403", ENV{ID_MODEL_ID}="6015", MODE="0666"
```

If you'd like to give your device a more meaningful name or you find the device file
changing (e.g. `/dev/ttyUSB1`) because you have multiple USB serial devices,
you can add a symlink for the device's tty file. The following extends the above rule file,
note the `SYMLINK` in the rule:

#### Contents of udev rule with symlink

```Bash
SUBSYSTEM=="tty", ENV{ID_VENDOR_ID}=="0403", ENV{ID_MODEL_ID}="6015", SYMLINK+="ttyUART", MODE="0666"
```

**NOTE:** When multiple USB serial devices with the same model and vendor ID are added, udev will
match on all of them and overwrite the symlink each time. The end result is only the last device matched
will be symlinked. As far as I am aware, the order is indeterminate, so there's no guarantees that the
symlink will map to the same device each time.

If this is the case, there may be other device information you can match on to ensure _only_ your
desired device is symlinked. The command `udevadm info` will prove useful for this. See `man 7 udevadm` for more info.

### 4. Verify the udev rule

Using the `udevadm test` command, simulate the application of udev rules to your
desired USB serial device. You'll also need the `/sys/` device path, but you can
get this with the `udevadm info` command.

Substituting in your device's `/dev/` path, run the following command. Look
for a line which contains 'MODE' and optionally a line that contains 'LINK', if you
configured a symlink for your device. These are visible in the command:

```Bash
$ sudo udevadm test $(udevadm info --query=path --name=/dev/ttyUSB0) 2>&1 | grep "80-usb-serial.rules"
Reading rules file: /etc/udev/rules.d/80-usb-serial.rules
ttyUSB0: /etc/udev/rules.d/80-usb-serial.rules:7 MODE 0666
ttyUSB0: /etc/udev/rules.d/80-usb-serial.rules:7 LINK 'ttyUART'
```

### 5. Reload udev rules

After this step, non-root users will have access to the device.

To do so, run the following command:

```Bash
$ sudo udevadm control --reload && sudo udevadm trigger
```

The `udevadm control --reload` command only reloads the rules for new events.
The `udevadm trigger` command replays kernel events so that your newly-loaded rule
applies to events which have already occured. This means you won't need to unplug and
replug your device in order for the new udev rule to take effect!

## References

- [Arch Linux Wiki udev Article]("https://wiki.archlinux.org/title/udev")
- [udev Terminology]("http://www.reactivated.net/writing_udev_rules.html#terminology")
- [udev Rule Creation Tutorial]("http://hackaday.com/2009/09/18/how-to-write-udev-rules/")
