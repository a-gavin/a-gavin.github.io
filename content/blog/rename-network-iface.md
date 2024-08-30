+++
title = "Renaming Linux Network Interfaces"
date = "2024-03-18"

#[taxonomies]
#tags = ["linux", "udev"]
+++

## Motivation

Depending on the machine and Linux distribution, different network interfaces may appear with different names. For example, `eth0`, `eno1`, `ens1`, `enp1s0`, and `enx0c9863d1a379` are all [valid Ethernet interface names](https://access.redhat.com/documentation/en-us/red_hat_enterprise_linux/7/html/networking_guide/ch-consistent_network_device_naming). Whether you like consistency or just want to give your interfaces more meaningful names, `udev` makes renaming network interfaces straightforward.

This guide generally targets WiFi and Ethernet interfaces, although concepts will apply to other interface types as well (except Bluetooth). It also assumes no pre-requisite software beyond a text editor, although `ethtool` may be useful.

## Before Getting Started

**NOTE:** This assumes you have root privileges on the machine you will configure.

**Proceed with caution.** It's always a good idea to have physical access to the system when performing networking-related or system-level changes. This is especially true for static configurations which largely rely on the interface name. It's possible that changes made here will disable networking.

If you're unfamiliar with using or configuring networking on Linux, I encourage you to familiarize yourself with the [Querying Network Information](@/blog/linux-cmds.md#querying-network-information) and [Managing Networking (Network Manager)](@/blog/linux-cmds.md#managing-networking-network-manager) sections of my Linux command cheatsheet.

## Instructions

### 1\. Identify Network Interface MAC Addresses

Before renaming network interfaces, we'll need the MAC address for each network interface to rename. MAC addresses for non-Bluetooth devices will appear in the output of `ip link show` (or `ip -br link show` for less verbose output).

If your system has easily identifiable interfaces, you can move to the next step. However, should your system contain multiple, harder to identify interfaces of the same type, read on.

#### Uh-Oh You have Ten of the Same NIC

There are a couple different ways to identify specific interfaces. Generally, for wired interfaces the `ethtool` command's `-p` option identifies interfaces by blinking the port's LED (when run as root). Wireless interfaces often times list their MAC address on a sticker on the RF shield (silver casing on the chip's PCB), often including both WiFi and Bluetooth when implemented on the same NIC.

Should neither of these be an option, `ip -d link show` lists the interface's PCI(e) parent device which can then be cross-referenced to the output of `lspci`, should you know the specific interface brand and model you're looking for.

### 2\. Create the udev Rule

Similar to my post on [configuring USB serial ports details](@/blog/usb-serial.md#3-create-the-udev-rule) details, we'll create a udev rule to rename the device.

#### udev Background

To be brief, `udev` is a daemon program that runs on many Linux distributions to manage and configure devices.

When configuring a device, be it a network interface or otherwise, `udev` iterates through the rules available on the system pattern matching as it goes. Should the rule match, `udev` will perform the action defined in the matched rule. Distributions generally come with a number of pre-configured rules ready to use on first boot. It's generally a good idea to not touch these, though.

With that said, **the name of the udev rule file matters**. Udev processes rules in lexically sorted order. As all installed rules on the system (including the ones provided by your distribution) are sorted and processed together, it's essential to name the udev rule file with this in mind. Doing so ensures that the new rule does not conflict with other system rules.

#### Configuring the udev Rule

With your MAC addresses and desired network interface names handy, create a rule in `/etc/udev/rules.d` of the format `XX-name.rules`, where `XX` is some positive number. Note that the higher the number here, the later udev processes this rule.

On my systems, I use `70`, as this comes before most of the pre-configured `udev` network interface configuration rules.

For example, here is a rule I have on a multi-Ethernet port system I use as my home router. It relabels the Ethernet ports from the strange, hardware-based naming scheme (e.g. formats `enpXs0` and `enoX` in a non-intuitive ordering) to names that reflect how they're used. Note that each line is a separate rule.

```
# /etc/udev/rules.d/70-rename-ethernet-ports.rules

# Single WAN port (leftmost port, labeled WAN1)
SUBSYSTEM=="net", ACTION=="add", ATTR{address}=="xx:xx:xx:xx:xx:xx", NAME="wan1"

# Three LAN port (right three ports, labeled LAN1, LAN2, LAN3)
SUBSYSTEM=="net", ACTION=="add", ATTR{address}=="xx:xx:xx:xx:xx:xx", NAME="lan1"
SUBSYSTEM=="net", ACTION=="add", ATTR{address}=="xx:xx:xx:xx:xx:xx", NAME="lan2"
SUBSYSTEM=="net", ACTION=="add", ATTR{address}=="xx:xx:xx:xx:xx:xx", NAME="lan3"
```

To use a similar rule on your system, substitute in the MAC address for the quoted address listed after the `ATTR{address}==` section and your desired interface name for the quoted name that comes after `NAME=`.

### 3\. Reboot and Validate Names Changed

Unlike USB serial devices, reloading udev rules won't necessarily rename the interfaces. A reboot is required, especially given networking configuration that typically only happens on startup.
