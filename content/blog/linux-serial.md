+++
title = "Configuring Linux Serial Access"
date = "2024-08-26"
description = ""

#[taxonomies]
#tags = ["linux"]
+++

## Overview

For systems with no graphics support, serial access is a requirement. Useful for systems that support graphics too, serial access provides a robust method of administering a system in times of trouble.

At its simplest, serial access provides a simple login shell for Linux systems. It's a bit crude generally and can be a bit frustrating to use at times. However, when a system begins to misbehave, the right serial configuration can make things much easier.

This guide demonstrates how to configure serial for a Linux system, including dumping kernel logs (`dmesg`) to serial. This guide also aims to enable simultaneous terminal access through both serial and display, should the target system support both.

## Instructions

**NOTE:** This guide assumes assumes you have root access to the system and that the target system is x86-64 based (ARM systems boot differently).

### 1\. Identify Serial Port

To configure serial, you must first ensure your system supports it.

If not immediately visible, first reference the system or motherboard datasheet. On systems more purposed for so-called 'edge' or firewall use, you will often find a built-in serial port alongside other IO ports. It is usually labeled 'Console' or 'COM'. These systems largely lack graphics support, so serial access is essential.

Alternatively, consumer and server motherboards may also provide a serial port, but this is not guaranteed. Serial may be either built-in alongside other IO ports (unlikely for consumer motherboards) or exposed pins on the motherboard. Labels are similar to firewall-type systems, but you may also see the label 'UART'.

If the system exposes multiple serial ports, pick one and keep track of it. We'll need this information later.

### 2\. Ensure Serial Port is Enabled

Boot your system into its BIOS or access its IPMI management console and ensure the serial port is enabled and configured to a reasonable baud rate (115200 is standard). This step varies significantly system to system. **When in doubt, leave other settings at default.**

On systems with an AMI BIOS, you'll often find this option under the 'Advanced' tab in 'Serial Port Console Redirection'.

### 3\. Identify Serial Port Connector Type, Procure Cable

Once you've verified the system provides a serial port and it is configured in the BIOS/IPMI interface, next identify _what type_ it is.

There are several different serial port types, but you will most often find one of the following. This list is not meant to be exhaustive:

- **RJ45:**

  - Easy to confuse for an Ethernet port, this type uses the same RJ45 connector as most Ethernet cables/NICs
  - Often found on more firewall-type systems
  - Requires cable with converter (e.g. RJ45 to USB)
  - **Connecting an Ethernet cable between systems will not work**

- **RS232:**

  - Looks like VGA but with two rows of pins instead of three
  - Most often found in server motherboards or industrial-grade systems
  - Requires cable with converter (e.g. RS232 to USB)
  - Ensure cable is right gender (i.e. pinned for pinhole port)

- **UART Pins:**

  - Uses pins or pinholes and requires jumper wires
  - Pins/pinholes most often found directly on the Motherboard or system PCB
  - May have to solder on pins or even determine which pins are which. [This video](https://www.youtube.com/watch?v=ZmZuKA-Rst0) can help with identification
  - Requires USB to serial converter and jumper wires, which often come separate
  - Ensure jumper wires are right gender on both ends

- **USB:**
  - Plain old USB
  - Not as frequent as other types, this type is often found in some commercial APs and more frequently in development boards (e.g. Arduino boards)
  - Unlike other types, this type will sit in front of a chip on the PCB that converts from serial to USB. No special cable required
  - **Make sure your cable has data wires and not just power.** Not all USB cables are built the same

### 4\. Configure Linux/GRUB Serial Settings

This step configures both Linux and GRUB to use serial output in addition to the system console. For context, GRUB is a bootloader used to select boot configurations including Linux. Documentation for these options is available [here](https://www.gnu.org/software/grub/manual/grub/html_node/Simple-configuration.html).

**These instructions assume you are using GRUB2**, which is basically every major Linux distribution at this point (including Ubuntu, Fedora, ArchLinux).

1. **Boot the system to the desired operating system**
2. **Back up the `/etc/default/grub` file in a safe place**
3. **As root, open the `/etc/default/grub` file in your desired text editor**

   This file contains configuration to boot the current operating system you're using, but other GRUB entries may be present in the final GRUB configuration file.

4. **Add or adjust the file to match the following in the configuration file**

   _Leave other configuration untouched unless you know what you're doing._

   ```
   GRUB_TERMINAL="serial console"
   GRUB_SERIAL_COMMAND="serial --unit=0 --speed=115200 --word-8 --parity=no --stop=1"
   ```

5. **Carefully add the following to the `GRUB_CMDLINE_LINUX` option**

   **Be extra cautious to only _add_** to the `GRUB_CMDLINE_LINUX` option, as these are options passed directly to the kernel. Deleting the wrong thing could cause your system to not boot (e.g. if you remove a `resume=...` option). See [here](https://www.kernel.org/doc/html/latest/admin-guide/kernel-parameters.html) for parameter documentation.

   Add exactly the following, separating from the previous option by a space character. Adjusting the baud and target serial device based on your system hardware:

   ```
   console=tty0 console=ttyS0,115200n8
   ```

   For example, the following is from a system I've configured (**do not copy verbatim, you will almost certainly misconfigure your system**):

   ```
   GRUB_CMDLINE_LINUX="resume=UUID=... rhgb console=tty0 console=ttyS0,115200n8"
   ```

6. **Update the GRUB configuration**

   Basically every distribution will use the `grub2-mkconfig` tool to generate a boot file, with specific invocation depending on the system.

   - Ubuntu:

     ```Bash
     # Can also do this by using the 'update-grub' and 'update-grub2' utilities
     grub2-mkconfig -o /boot/grub/grub.cfg
     ```

   - Fedora:

     ```Bash
     grub2-mkconfig -o /boot/grub2/grub.cfg
     ```

7. **Power off the system**

### 5\. Install Desired Serial Access Program

To access serial on a target system, you'll need to install a serial access program on the device you'll connect the _other end_ of the serial cable to. I'll refer to this as the _host system_.

Which program you choose depends on personal preference. I use `minicom` most often, but PuTTy and `screen` are other well-utilized options. For newer users, I recommend PuTTy.

### 6\. Connect to Serial Port

1. **Connect serial cable**

   With your serial cable, attach the USB end of the cable to the _host system_ then attach the other end to the desired serial port on the _target system_.

2. **Verify that the _host system_ detects the serial cable**

   How you do this will depend on the operating system.

   On Linux, check the output of `sudo dmesg | grep tty`. Save the TTY name for later (e.g. `ttyUSB0` or `ttyACM0`). Windows will show the device as a COM port in the 'Device Manager' GUI.

3. **Open your installed serial access program**

   **NOTE:** You will need to adjust the baud rate and hardware flow control here. `minicom` does this in a sub-menu that you can open using the 'CTRL-A' keystroke.

   The specifics here will depend on the program you've chosen. If you're using `minicom` or `screen`, you must specify the TTY as an argument. For example, `minicom -D /dev/ttyUSB0`.

   Most Linux systems will only permit access to USB serial devices by default with root permissions. It is possible to permit this as non-root user configuring udev rules or adding the user to a specific group, but this depends on the distribution. See [this post](@/blog/usb-serial.md) I wrote to configure this using udev rules.

4. **Boot target system**

   Assuming everything is correct, you should have serial access to your system after this point!

   If you see garbled or no output, you may need to adjust the baud rate or disable flow control.
