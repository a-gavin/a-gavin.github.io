+++
title = "Renaming Linux Network Interfaces"
date = "2024-03-18"
path = "blog/renaming-network-interfaces"

#[taxonomies]
#tags = ["linux", "udev"]
+++

## Motivation

**Update:** While udev works great for this, for many users systemd '.link' files may be a more straightforward solution.
This guide details both the previous udev method as well as the systemd '.link' method.

Depending on the machine and Linux distribution, different network interfaces may appear with different names. For example,
the following are all [valid Ethernet interface names](https://access.redhat.com/documentation/en-us/red_hat_enterprise_linux/7/html/networking_guide/ch-consistent_network_device_naming):

- `eth0`
- `eno1`
- `ens1`
- `enp1s0`
- `enx0c9863d1a379`

Whether you like consistency or just want to give your interfaces more meaningful names, systemd and `udev` makes renaming network
interfaces straightforward.

This guide generally targets WiFi and Ethernet interfaces, although concepts will apply to other interface types as well
(except Bluetooth). It also assumes no pre-requisite software beyond a text editor and systemd, although, `ethtool`
may be useful.

## Before Getting Started

- **This guide assumes you have root privileges on the machine you will configure.**

- **Only do this if you have non-networked access to the system or it's not a critical system.**

  - It is very possible that these instructions may disable networking entirely, if you're not careful.
      It's best to do this when you have direct, non-networked access to the system (e.g. serial or keyboard and mouse)

- **Both udev rules files and systemd '.link' order their execution of rules/config files based on file name.**

  - Generally, these files are named with formats like `70-xxxx.rules` or `10-xxx.link`, where the leading
    number explicitly establishes the order of execution. *The lower the number, the higher the priority.*

  - For udev, I recommend naming with `70-xxxx.rules` as the format, as this precedes many default udev rules
    installed on most distributions.

If you're unfamiliar with using or configuring networking on Linux, I encourage you to review the commands listed
[here](@/blog/2023-12-linux-cmds.md#querying-network-information) and [here](@/blog/2023-12-linux-cmds.md#managing-networking-networkmanager)
in of my Linux command reference.

## Instructions

### 1\. Identify Network Interface MAC Addresses

Before renaming network interfaces, we'll need the MAC address for each network interface to rename. MAC addresses for
non-Bluetooth devices will appear in the output of `ip link show` (or `ip -br link show` for less verbose output).

If your system has easily identifiable interfaces, you can move to the next step. However, should your system contain
multiple, harder to identify interfaces of the same type, read on.

#### Uh-Oh You have Ten of the Same NIC

There are a couple different ways to identify specific interfaces. For wired interfaces, most drivers support the `ethtool`
command's `-p` option which blinks the port's LED. Wireless interfaces often times list their MAC address on a sticker on
NIC. Be careful, though, as this may often list both WiFi and Bluetooth if both are supported.

Should neither of these be an option, `ip -d link show` lists the interface's PCI(e) parent device which you can
cross-referenced with the output of `lspci`, should you know the specific interface brand and model you're looking for.

### 2\. Configure udev Rule or systemd '.link' File

Depending on preference and level of comfort, either the systemd '.link' or udev rule approach may be more suitable.
For simplicity, I recommend the systemd '.link' method.

Both methods in this step assume you have MAC addresses and desired network interface names ready to go.

#### Method 1: Configure systemd '.link' File

To rename network interfaces with systemd '.link' files, we will create one file per interface in the `/etc/systemd/network/`
directory. Like udev, the '.link' config files permit fine-grained matching of interfaces. However, they use a simpler and
more common TOML format.

While you may also configure `systemd-network` settings in this directory, '.link' files here are parsed regardless
of whether `systemd-network` is installed or not, meaning this method will work with NetworkManager.

Similar to udev, '.link' file names are parsed in alphanumeric order. For simplicity, I recommend sticking to a format like
`10-XX.link` which lists clearly denotes the order in the first few characters. More details [above](#before-getting-started).

For each network interface, create a '.link' file in the `/etc/systemd/network/` directory, substituting in your desired
network interface name and corresponding MAC address. More details and matching options are listed [here](https://www.freedesktop.org/software/systemd/man/latest/systemd.link.html)
in the systemd documentation.

```TOML
# For example, /etc/systemd/network/10-eth0.link
# If active, systemd-networkd will warn that this legacy-style interface name is unpredictable
[Match]
MACAddress=xx:xx:xx:xx:xx:xx

[Link]
Name=eth0
```

#### Method 2: Configure udev Rule

Similar to my post on [configuring USB serial ports details](@/blog/2022-12-linux-usb-serial.md#3-create-the-udev-rule) details, we'll create a udev rule to rename the device.

#### udev Background

To be brief, `udev` is a daemon program that runs on many Linux distributions to manage and configure devices.

When configuring a device, be it a network interface or otherwise, `udev` iterates through the rules available on the system
pattern matching as it goes. Should the rule match, `udev` will perform the action defined in the matched rule. Distributions
generally come with a number of pre-configured rules ready to use on first boot. It's generally a good idea to not touch
these, though.

With that said, **the name of the udev rule file matters**. Udev processes rules in lexically sorted order. As all installed
rules on the system (including the ones provided by your distribution) are sorted and processed together, it's essential to
name the udev rule file with this in mind. Doing so ensures that the new rule does not conflict with other system rules.
See [above](#before-getting-started) for more details.

#### Configuring the udev Rule

With your MAC addresses and desired network interface names handy, create a rule in `/etc/udev/rules.d` of the format
`XX-name.rules`, where `XX` is some positive number. On my systems, I use `70`, as this comes before most of the
pre-configured `udev` network interface configuration rules.

For example, here is a rule I have on a multi-Ethernet port system. It relabels the Ethernet ports from the strange,
hardware-based naming scheme (e.g. formats `enpXs0` and `enoX` in a non-intuitive ordering) to names that
reflect how they're used. Note that each line is a separate rule.

```Bash
# For example, /etc/udev/rules.d/70-rename-ethernet-ports.rules

# Single WAN port (leftmost port, labeled WAN1)
SUBSYSTEM=="net", ACTION=="add", ATTR{address}=="xx:xx:xx:xx:xx:xx", NAME="wan1"

# Three LAN port (right three ports, labeled LAN1, LAN2, LAN3)
SUBSYSTEM=="net", ACTION=="add", ATTR{address}=="xx:xx:xx:xx:xx:xx", NAME="lan1"
SUBSYSTEM=="net", ACTION=="add", ATTR{address}=="xx:xx:xx:xx:xx:xx", NAME="lan2"
SUBSYSTEM=="net", ACTION=="add", ATTR{address}=="xx:xx:xx:xx:xx:xx", NAME="lan3"
```

To use a similar rule on your system, substitute in the MAC address for the quoted address listed after the `ATTR{address}==` section and your desired interface name for the quoted name that comes after `NAME=`, adding more or removing rules as necessary.

### 3\. Reboot and Validate Names Changed

Unlike USB serial devices, reloading udev rules won't generally rename the interfaces. For the changed names to take effect,
you must reboot the system.

```Bash
sudo reboot now
```
