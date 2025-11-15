+++
title = "Accessing Serial Devices on Linux w/o sudo"
date = "2022-12-13"
description = "How to use udev rules to give non-root users access to a USB serial device."
path = "blog/linux-usb-serial"

#[taxonomies]
#tags = ["linux", "udev", "usb"]
+++

## Motivation

If you're using a USB serial device like an FTDI USB UART serial converter on Linux,
you'll need root permission to use the device by default, which can be annoying to
remember every time you need to use the device.

Some distributions support a `plugdev` group which permits users in the group to access
such devices without root permissions. However, the permissions here are broad, and
it may be more desirable to limit users to specific devices.

A udev rule is one method to permit access on a more granular level. This guide details
how to configure such a rule. For more information, see [this article](https://wiki.archlinux.org/title/udev).

## Instructions

### 1. Identify the device

Run `ls /dev/`. The device will show up as a `/dev/ttyACMx` or
`/dev/ttyUSBx`, where `x` is some positive number.

If there are multiple `ttyACM` and/or `ttyUSB` devices visible, run the following command
then unplug and re-plug in the USB device. This will output information on USB
device initialization, generally including the USB serial device TTY file.

```Bash
sudo dmesg -w | grep "usb"
```

For example, here is the output from my system. Note the last line of the output
where it lists the USB serial device TTY file as `ttyUSB1`:

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

Run the `udevadm info` command to get the USB device model and vendor ID (also visible in
the `dmesg` command in the previous instruction).

For example, the following outputs the model and vendor ID of the `/dev/ttyUSB1` device.

```Bash
$ udevadm info /dev/ttyUSB1 | grep -e ID_VENDOR_ID -e ID_MODEL_ID
E: ID_VENDOR_ID=0403
E: ID_MODEL_ID=6015
```

### 3. Create the udev rule

With root permissions (e.g. `sudo`), create a new udev rule file in `/etc/udev/rules.d/`,
for example `80-usb-serial.rules`. The number prefix is important here for order of udev
rule execution, the lower the prefix the higher the priority.

Then in your preferred editor, add the below line, substituting in the model and vendor ID
you found in the previous step.

```Bash
# Contents of udev rule
SUBSYSTEM=="tty", ENV{ID_VENDOR_ID}=="0403", ENV{ID_MODEL_ID}="6015", MODE="0666"
```

If you'd like to give your device a more meaningful name or you have multiple devices
which cause the name to change on subsequent, configure the rule with a symlink as follows.

```Bash
# Creates a udev rule for the device which symlinks the tty file to '/dev/ttyUART'
SUBSYSTEM=="tty", ENV{ID_VENDOR_ID}=="0403", ENV{ID_MODEL_ID}="6015", SYMLINK+="ttyUART", MODE="0666"
```

**NOTE:** When multiple USB serial devices with the same model and vendor ID are added, udev will
match on all of them and overwrite the symlink each time. The end result is only the last device matched
will be symlinked, and this is not determinat. To alleviate this, add additional matching
information to the udev rule. The command `udevadm info` will prove useful for this. See `man 7 udevadm`
for more info.

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

run the following command to now permit non-root users to access the device.

```Bash
sudo udevadm control --reload && sudo udevadm trigger
```

To provide more context, the `udevadm control --reload` command reloads the rules
for new events while `udevadm trigger` replays kernel events so that your newly-loaded rule
applies to events which have already occured. No need to unplug and replug your device!

## References

- [Arch Linux Wiki udev Article](https://wiki.archlinux.org/title/udev)
- [udev Terminology](http://www.reactivated.net/writing_udev_rules.html#terminology)
- [udev Rule Creation Tutorial](http://hackaday.com/2009/09/18/how-to-write-udev-rules/)
