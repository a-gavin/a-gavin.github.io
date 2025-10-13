+++
title = "Linux Command Cheatsheet"
date = "2023-12-26"
path = "blog/linux-cmds"

#[taxonomies]
#tags = ["linux", "sysadmin"]
+++

<!-- General commands -->
<!-- TODO: grep w/ regex -->

## Overview

This post serves to document useful Linux commands I use regularly or find useful. I intend to update it periodically as I find more and more useful commands.

Some command explanation is included with each, but Linux and command line experience is assumed.

## General Commands

These commands aren't necessarily Linux machine-specific, but they may come in handy when using one.

#### Run Command Every N Seconds

```Bash
# Prints 'Vale la pena' once every half second
$ watch -n 0.5 echo 'Vale la pena'

# For when 'watch' is not available
$ while true; do echo 'Vale la pena'; sleep 1; clear; done
```

#### View File Contents as File Updates

```Bash
# I usually run with '-F' instead of '-f', as '-f' will terminate
# when a file is deleted (e.g. log file rotates). See 'man tail'.
$ tail -f lanforge_log_1.txt
```

#### Search for File

```Bash
# The '.' here specifies to search in and all sub-directories of the '$CWD'
$ find . -name "\*.html"
./blog.html
./projects.html
```

#### Search for a Pattern (grep)

```Bash
# Search for a pattern in a file
# By default, this is not a regular expression pattern (see the '-E' flag)
$ grep "string" file.txt

# Search for a pattern in text read from a pipe (equivalent to above)
$ cat file.txt | grep "string"

# Search for multiple patterns in a file
$ grep -e "string1" -e "string2" file.txt

# Search for the pattern case-insensitive
$ grep -i "String" file.txt

# Print line number for every matched pattern
$ grep -i "String" file.txt

# Search for anything that doesn't match the specified pattern
$ grep -v "ath10k" dmesg.txt

# When piping data from a file that's actively being written to
# make sure to pass the '--line-buffered' argument. Otherwise,
# it may not match the specified pattern, even if it's written
# to the file
$ tail -F log_file.txt | grep --line-buffered "canary"

# Search for pattern in the output of text continuously read from a pipe
# (don't forget the '--line-buffered'!) then write the output to both
# the terminal (stdout) and a text file
$ journalctl -f | grep --line-buffered "mt7921" | tee out.txt
```

#### Login to a Remote System (ssh)

```Bash
# Login into a remote system over SSH
# Destination system is typically an IP address, hostname, or alias
ssh user@192.168.1.1

# Remote in using a non-standard port (default is 22)
# Note that the 'scp' command uses the '-P' option for port
ssh -p 2222 user@server

# Remote in using SSH URI (equivalent to previous command)
ssh ssh://user@server:2222

# Generate a new SSH public/private key pair
#
# This is used both for authentication purposes on a remote system
# and identifying a remote system to your system (~/.ssh/known_hosts)
ssh-keygen -t ed25519

# Copy an SSH public key to a remote system
#
# This allows you to login using the associated private key.
# The '-i' flag specifies the specific key to copy. Otherwise,
# the default is used (if no '.pub' specified, it's automatically added)
#
# You can also alternatively use the 'ssh' command to manually copy
# your public key into the 'known_hosts' file on the remote system,
# but this does it for you. Using 'scp':
#   cat .ssh/id_ed25519.pub | ssh user@server 'cat >> ~/.ssh/authorized_keys'
ssh-copy-id -i ~/.ssh/id_ed25519.pub user@server

# Port forwards the remote port to local system through a jumphost.
# Here, the remote port is port 80 (generally HTTP) and the local
# port is 8080. This would permit accessing the 'target-system'
# webserver using the 'http://localhost:8080' URL.
ssh -N -L 8080:target-system:80 user@jump-system
```

<!-- System Administration: Non-Systemd -->

## System Administration: Non-Systemd

#### Show All Running Processes

**NOTE:** Systemd command `systemctl status` does similar but includes Cgroup-specific information as well.

```Bash
# Show all current processes running for current user
$ ps a
    PID TTY      STAT   TIME COMMAND
   2282 tty2     Sl+    0:00 /usr/libexec/gnome-session-binary --session=ubuntu
   5009 pts/0    Ss     0:00 zsh
   ...
```

```Bash
# Show all processes running on system
$ ps -e
    PID TTY          TIME CMD
      1 ?        00:00:01 systemd
      2 ?        00:00:00 kthreadd
      3 ?        00:00:00 rcu_gp
    ...
```

#### Get All PIDs of Program (if Running)

```Bash
# Get PIDs of Firefox program
$ pgrep firefox
4602
5086
```

#### Kill Running Process (USE CAUTION)

```Bash
# Kill process w/ PID 921. Default signal to send is 'TERM', so command is same as 'kill -s TERM'
# More immediate (and potentially harmful) is the 'KILL' signal.
$ kill 921
```

#### View Kernel Logs

```Bash
# Run with '-w' to follow in real time (like 'tail -f')
# The 'journalctl -k' command will also show kernel logs and is generally more flexible
$ sudo dmesg
```

<!-- System Administration: Systemd -->

## System Administration: Systemd

<!-- TODO: systemctl commands (status, start/stop/restart, daemon-reload, enable/disable, edit)-->

#### Show Systemd Unit Status

```Bash
# The '.service' is optional if there are no other Systemd units w/ same name
# The bottom of the output is the same as would be output by 'journalctl -b 0 -u NetworkManager-wait-online'
$ systemctl status NetworkManager-wait-online.service
● NetworkManager-wait-online.service - Network Manager Wait Online
     Loaded: loaded (/lib/systemd/system/NetworkManager-wait-online.service; enabled; vendor preset: enabled)
     Active: active (exited) since Sun 2024-03-17 12:29:11 PDT; 5h 59min ago
       Docs: man:nm-online(1)
    Process: 1035 ExecStart=/usr/bin/nm-online -s -q (code=exited, status=0/SUCCESS)
   Main PID: 1035 (code=exited, status=0/SUCCESS)
        CPU: 71ms

Mar 17 12:29:02 meadowlark systemd[1]: Starting Network Manager Wait Online...
Mar 17 12:29:11 meadowlark systemd[1]: Finished Network Manager Wait Online.
```

#### Manage and Configure Systemd Unit

**NOTE:** After editing a Systemd unit file, you must run `systemctl daemon-reload` for the changes to take effect.

The following assumes an example _system-level_ Systemd unit called `run_periodically.timer`. You can use the same commands for _user-level_ Systemd units like `pulseaudio.service`, e.g. `systemctl status --user pulseaudio.service`.

Active (enabled) systemd unit files are located in `/etc/systemd/system/` and `/etc/systemd/user/` directories.
When modifying systemd units, modify files in these directories. Other unit files exist on Linux systems, primarily in a `/usr/lib/systemd/` directory (depends on distribution). However, generally do not modify these as they are installed by your package manager and are meant as defaults.

```Bash
# Start the unit
$ sudo systemctl start run_periodically.timer

# Stop the unit
$ sudo systemctl stop run_periodically.timer

# Restart the unit
$ sudo systemctl restart run_periodically.timer

# Enable the unit (start automatically)
$ sudo systemctl enable run_periodically.timer

# Disable the unit (only starts manually)
$ sudo systemctl disable run_periodically.timer

# Mask the unit
# This prevents users from starting or enabling the unit
$ sudo systemctl mask run_periodically.timer

# Unmask the unit
# This undoes the effect of a 'systemctl mask'
$ sudo systemctl unmask run_periodically.timer

# Edit the unit (opens in editor specified in $EDITOR environment variable)
#
# You can also manually edit the unit file by finding it in '/etc/systemd/'.
# Do not edit the unit files in '/usr/lib/systemd/' or '/usr/lib64/systemd'.
# The exact directory will depend on your Linux distribution.
$ sudo systemctl disable run_periodically.timer

# Reload the unit files for all Systemd units
$ sudo systemctl daemon-reload
```

#### View Service (Daemon) Logs

The following is a list of `journalctl` commands, each with separate options. Many of these may be combined to perform a specific task. For example, `journalctl -k -b 50 -r` will show the last 50 lines of kernel logs in reverse order (most recent to least recent).

Just as Systemd `systemctl` commands support both system-level and user-level units, `journalctl` does as well using the same `--user` argument.

```Bash
# Prints all log lines. Will be very long
$ journalctl

# Print only the last 100 log lines
$ journalctl -n 100

# Follow logs in real time (similar to 'tail -f')
# Can also substitute '--follow' for '-f'
$ journalctl -f

# Show logs in reverse order (most recent to least recent)
# Cannot use this option with '-f'
$ journalctl -r

# Show all logs that contain the provided pattern, here 'wlan0'
# Can also substitute the '--grep' option for '-g'
$ journalctl -g wlan0

# Only show logs for a specific ID, here 'test_program'.
# For example, the following would create a log message and
# tag it with the 'test_program' tag:
#   echo "This is a warning message" | systemd-cat -t test_program -p warning
#
# Note that this is different from the '-u' option
$ journalctl -t test_program

# Only show logs for a specific service, here, 'wpa_supplicant.service'
# Can also provide full Systemd unit name, e.g. here 'wpa_supplicant.service'
$ journalctl -u wpa_supplicant

# Show kernel logs (same output as 'dmesg' command)
# Can also substitute the '--dmesg' option for '-k'
#
# This is the same as 'journalctl -t kernel'
$ journalctl -k

# Only show logs for this boot (can use '-b' option instead of '--boot')
# When using the '--boot' and '-b' arguments, '0' and '-0' function the same (this boot)
$ journalctl --boot 0

# Only show logs for the last boot (can use '-b' option instead of '--boot')
$ journalctl --boot -1
```

<!-- Querying HW info -->

## Querying Hardware Information

#### Show System Hardware Information

It is recommended to run this command with root privileges to get the most detailed information.

For more CPU/NUMA-focused information in a pop-up GUI format, the `lstopo` command may prove useful. It has a text-only mode as well for non-GUI use cases.

```Bash
$ sudo lshw
    hostname
    description: Notebook
    product: XXXXXXXXXXX (XXXXXXXXXXX)
    vendor: XXXXXXXXXXX
    version: XXXXXXXXXXX
    serial: XXXXXXXXXXX
    width: 64 bits
    capabilities: smbios-3.3.0 dmi-3.3.0 smp vsyscall32
    configuration: administrator_password=disabled chassis=notebook family=XXX power-on_password=disabled sku=XXX uuid=9b2d86cc-2b0f-11b2-a85c-ad3b66e4d98e
...
```

#### Show USB Device Information

```Bash
# Use '-v' for more verbose output
$ lsusb
Bus 004 Device 001: ID 1d6b:0003 Linux Foundation 3.0 root hub
Bus 003 Device 002: ID 0489:e0cd Foxconn / Hon Hai Wireless_Device
Bus 003 Device 001: ID 1d6b:0002 Linux Foundation 2.0 root hub
Bus 002 Device 001: ID 1d6b:0003 Linux Foundation 3.0 root hub
Bus 001 Device 002: ID 30c9:0030 Luxvisions Innotech Limited Integrated Camera
Bus 001 Device 001: ID 1d6b:0002 Linux Foundation 2.0 root hub

# Filter on vendor and product ID
$ lsusb -d 0489:e0cd
Bus 003 Device 002: ID 0489:e0cd Foxconn / Hon Hai Wireless_Device

# Filter on bus and device number
$ lsusb -s 003:002
Bus 003 Device 002: ID 0489:e0cd Foxconn / Hon Hai Wireless_Device

# Show USB devices in a tree format
# Remove the '-v' option to only see bus/device numbers
$ lsusb -t -v
/:  Bus 04.Port 1: Dev 1, Class=root_hub, Driver=xhci_hcd/2p, 10000M
    ID 1d6b:0003 Linux Foundation 3.0 root hub
/:  Bus 03.Port 1: Dev 1, Class=root_hub, Driver=xhci_hcd/4p, 480M
    ID 1d6b:0002 Linux Foundation 2.0 root hub
    |__ Port 4: Dev 2, If 0, Class=Wireless, Driver=btusb, 480M
        ID 0489:e0cd Foxconn / Hon Hai
        ...
```

#### Show PCI(e) Device Information

```Bash
# Use the '-v', '-vv', '-vvv' options to show more information with increasing verbosity
# Use the '-k' option to show kernel drivers used (on by default w/ '-v')
$ lspci
...
02:00.0 Ethernet controller: Realtek Semiconductor Co., Ltd. RTL8111/8168/8411 PCI Express Gigabit Ethernet Contr
03:00.0 Network controller: MEDIATEK Corp. MT7921 802.11ax PCI Express Wireless Network Adapter
...

# Filter on PCI(e) bus
$ lspci -s 03:00.0
03:00.0 Network controller: MEDIATEK Corp. MT7921 802.11ax PCI Express Wireless Network Adapter

# Show PCI(e) devices in a tree format
# Remove the '-v' option to only see bus/device numbers
$ lspci -t -v
-[0000:00]-+-00.0  Advanced Micro Devices, Inc. [AMD] Renoir/Cezanne Root Complex                                 [3/140]
           ...
           +-02.2-[02]----00.0  Realtek Semiconductor Co., Ltd. RTL8111/8168/8411 PCI Express Gigabit Ethernet Controller
           +-02.3-[03]----00.0  MEDIATEK Corp. MT7921 802.11ax PCI Express Wireless Network Adapter
           +-08.0  Advanced Micro Devices, Inc. [AMD] Renoir PCIe Dummy Host Bridge
           +-08.1-[04]--+-00.0  Advanced Micro Devices, Inc. [AMD/ATI] Barcelo
           |            +-00.1  Advanced Micro Devices, Inc. [AMD/ATI] Renoir Radeon High Definition Audio Controller
           ...
```

#### List Block Devices

For more disk-specific utilization info, see `df` command usage below.

```Bash
$ lsblk
NAME MAJ:MIN RM SIZE RO TYPE MOUNTPOINTS
...
loop18      7:18    0 428K    1 loop /snap/snapd-desktop-integration/57
loop19      7:19    0 452K    1 loop /snap/snapd-desktop-integration/83
nvme0n1     259:0   0 476.9G  0 disk
├─nvme0n1p1 259:1   0 512M    0 part /boot/efi
└─nvme0n1p2 259:2   0 476.4G  0 part /
```

#### Show Disk Usage

```Bash
# Use the '-h' flag for human-readable output (in base 1024).
# NOTE: The '-H' flag is human-readable but in base 1000 units
$ df -h
Filesystem      Size  Used Avail Use% Mounted on
tmpfs           2.3G  2.4M  2.3G   1% /run
efivarfs        248K  154K   90K  64% /sys/firmware/efi/efivars
/dev/nvme0n1p2  468G  131G  314G  30% /
tmpfs            12G   21M   12G   1% /dev/shm
tmpfs           5.0M  4.0K  5.0M   1% /run/lock
/dev/nvme0n1p1  511M  6.1M  505M   2% /boot/efi
tmpfs           2.3G  1.7M  2.3G   1% /run/user/1000
```

#### Show Disk Usage by Directory

```Bash
# Use the '-h' flag for human-readable output (unsure what base is used)
# NOTE: The '-H' flag for 'du' is not the same as the '-H' flag for 'df'
$ du -h
1.5M    ./images
44K     ./blog
...
5.4M    .
```

<!-- Querying Network Information -->
<!-- TODO: nmap -->
<!-- TODO: Advanced networking section with 1q vlan, vrf -->

## Querying Network Information

**NOTE:** These commands are listed for diagnostic purposes. You probably want to use NetworkManager to
configure your system's networking instead. See the [next section](#managing-networking-networkmanager) for more details.

Most Linux distributions run NetworkManager to configure and manage networking nowadays. This is a common point of confusion, as many guides online reference older, network-scripts based network management and the deprecated `ifconfig` command.

It is possible to configure networking with variations of these commands. Generally, though, you'll almost always be better off using a tool like `NetworkManager` or `systemd-networkd`, unless you have a very specific use case.

For more information, see this [very detailed guide](https://axil.gitlab.io/iproute2/).

#### Show Network Interface Driver and Firmware

```Bash
# Generally 'ethtool' is not installed on Linux systems by default
$ ethtool -i enp2s0
driver: r8169
version: 6.14.8
firmware-version: rtl8168h-2_0.0.2 02/26/15
expansion-rom-version: 
bus-info: 0000:02:00.0
supports-statistics: yes
supports-test: no
supports-eeprom-access: no
supports-register-dump: yes
supports-priv-flags: no
```

#### Show Network Interface Link-Layer Info

Displays interface status and MAC address. More detailed output is possible by
using the `-d` option (without the `-br` option).

**NOTE:** Take note of information to the right of the MAC addresses. 'UP' indicates interface is running. 'LOWER_UP' means the driver is functioning. For example, a non-configured but plugged in ethernet device may be 'DOWN' but 'LOWER_UP'. For Ethernet interfaces, 'NO-CARRIER' indicates that there is no signal on the wire (it's disconnected).

```Bash
# Shorthand shown. Full command would be 'ip link show', but the 'show' is optional.
$ ip -br l
lo               UNKNOWN        00:00:00:00:00:00 <LOOPBACK,UP,LOWER_UP>
enp2s0           DOWN           xx:xx:xx:xx:xx:xx <NO-CARRIER,BROADCAST,MULTICAST,UP>
wlan0            UP             xx:xx:xx:xx:xx:xx <BROADCAST,MULTICAST,UP,LOWER_UP>
```

#### Show Network Interface Link-Layer Stats

Statistics available depend on the device.

```Bash
# Generally 'ethtool' is not installed on Linux systems by default
$ ethtool -S enp2s0
NIC statistics:
     tx_packets: 0
     rx_packets: 0
     tx_errors: 0
     rx_errors: 0
     rx_missed: 0
     align_errors: 0
     tx_single_collisions: 0
     tx_multi_collisions: 0
     unicast: 0
     broadcast: 0
     multicast: 0
     tx_aborted: 0
     tx_underrun: 0
```

#### Show Network Interface IP-Layer Info

These commands display IPv4 and IPv6 information in addition to other detailed information including interface status, MAC address, MTU, and interface routing table, among other things (some of which require `-d` option). More detailed output is possible by using the `-d` option (without the `-br` option).

```Bash
# Shorthand shown. Full command would be 'ip addr show', but the 'show' is optional.
$ ip -br a
lo               UNKNOWN        127.0.0.1/8 ::1/128
enp2s0           DOWN
wlan0            UP             192.168.0.234/24 fe80::xxx:xxxx:xxxx:xxxx/64

# Only show IPv4 information
$ ip -4 addr show

# Only show IPv6 information
$ ip -6 addr show
```

#### Show ARP Tables

```Bash
# Shorthand is 'ip n'
$ ip neigh
10.199.0.1 dev wlan0 lladdr 00:50:e8:04:57:ab REACHABLE

# Show specific interface's ARP table
$ ip neigh show dev wlan0
10.199.0.1 dev wlan0 lladdr 00:50:e8:04:57:ab REACHABLE
```

#### Show Routing Tables

```Bash
# Shorthand is 'ip r'. Will show all IPv4 routing tables.
# The '169.254.0.0/16' route is link-local IPv4 and is mostly default.
$ ip route
default via 10.199.0.1 dev wlan0 proto dhcp metric 600
10.199.0.0/20 dev wlan0 proto kernel scope link src 10.199.4.142 metric 600
169.254.0.0/16 dev wlan0 scope link metric 1000

# Show IPv6 routing tables only
$ ip -6 route
::1 dev lo proto kernel metric 256 pref medium
fe80::/64 dev wlan0 proto kernel metric 1024 pref medium

# Determine what route traffic will take for a specific address, here '8.8.8.8'
$ ip route get 8.8.8.8
8.8.8.8 via 10.199.0.1 dev wlan0 src 10.199.4.142 uid 1000
cache

# Show routes in routing table 10
$ ip route show table 10
```

```Bash
# Shorthand is 'ip r'. Will show all IPv4 routing tables.
# The '169.254.0.0/16' route is link-local IPv4 and is mostly default.
$ ip route
default via 10.199.0.1 dev wlan0 proto dhcp metric 600
10.199.0.0/20 dev wlan0 proto kernel scope link src 10.199.4.142 metric 600
169.254.0.0/16 dev wlan0 scope link metric 1000

# Show IPv6 routing tables only
$ ip -6 route
::1 dev lo proto kernel metric 256 pref medium
fe80::/64 dev wlan0 proto kernel metric 1024 pref medium

# Determine what route traffic will take for a specific address, here '8.8.8.8'
$ ip route get 8.8.8.8
8.8.8.8 via 10.199.0.1 dev wlan0 src 10.199.4.142 uid 1000
cache

# Show routes in routing table 10
$ ip route show table 10
```

#### Show Open Sockets (Existing Connections)

I typically use this as `ss -tulpn` and `grep` for what I want. If you run as root (e.g. with `sudo`), you will also see the program that is using the socket.

```Bash
# Main options are:
# '-u' for UDP
# '-t' for TCP
# '-p' display process (if have permission for given process)
# '-l' display only listening sockets
# '-a' display listening and established sockets (no '-a' or '-l' will only display established)
# '-n' do not attempt to resolve service name for port (to guarantee port num is printed)
$ sudo ss -tulpn
Netid  State   Recv-Q  Send-Q    Local Address:Port      Peer Address:Port  Process
udp    UNCONN  0       0         127.0.0.53%lo:53             0.0.0.0:*      users:(("systemd-resolve",pid=895,fd=13))
udp    UNCONN  0       0               0.0.0.0:631            0.0.0.0:*      users:(("cups-browsed",pid=1845,fd=7))
....
```

<!-- Managing Networking -->

## Managing Networking (NetworkManager)

At a high level, NetworkManager configures 'connections' which are established using a backing network interface, or in NetworkManager terms, 'device'. These network interfaces are either managed or unmanaged from NetworkManager's perspective.

Generally, most users will be fine with NetworkManager configuring all of their
network interfaces, typically only WiFi and Ethernet (although NetworkManager can do much more). There are times, though, where it is appropriate to have NetworkManager [ignore specific interfaces](#set-device-management), for example, when doing [WiFi packet capture](@/blog/2023-10-wifi-packet-capture.md).

This section details some of the most basic and more-useful (from my perspective) NetworkManager CLI commands. See `man nmcli-examples` for more examples and more advanced usage of NetworkManager.

#### Show All Devices

Shows all NetworkManager-tracked network devices, including both devices
that are managed and unmanaged by NetworkManager.

```Bash
# Shorthand shown. Full command is 'nmcli device'
$ nmcli d
DEVICE         TYPE      STATE         CONNECTION
wlan0          wifi      disconnected  --
enp2s0         ethernet  unavailable   --
lo             loopback  unmanaged     --
```

#### Show All Connections

Shows both active and inactive connections.

Naming is typically the SSID (WiFi network name) for WiFi connections and 'Wired Connection X' for Ethernet connections.

When typing `nmcli connection` commands, active connections will tab complete, but inactive connections do not.

```Bash
# Shorthand shown. Full command is 'nmcli connection show'
$ nmcli c
NAME UUID TYPE DEVICE
SSID_NAME 2c5fc1ff-565f-495c-b6d3-59d5be6facde wifi wlan0
Wired Connection 1 167b3f3b-acb7-4ca2-9480-c41868641214 ethernet --
```

#### Show Specific Device Info

<!-- Link "Show Specific Connection Info" to the nmcli c s command -->

Only shows device-specific information. The command in used in
[Show Specific Connection Info](#show-specific-connection-info) will provide this and more information, assuming there is a connection which uses the device.

```Bash
# Shorthand shown. Full command is 'nmcli device show enp2s0'
$ nmcli device show enp2s0
GENERAL.DEVICE:                         enp2s0
GENERAL.TYPE:                           ethernet
GENERAL.HWADDR:                         xx:xx:xx:xx:xx:xx
GENERAL.MTU:                            1500
GENERAL.STATE:                          20 (unavailable)
GENERAL.CONNECTION:                     --
...
```

#### Show Specific Connection Info

```Bash
# Shorthand shown. Full command is 'nmcli connection show "Wired Connection 1"'
$ nmcli c show "Wired Connection 1"
connection.id:                          Wired Connection 1
connection.uuid:                        167b3f3b-acb7-4ca2-9480-c41868641214
connection.stable-id:                   --
connection.type:                        802-3-ethernet
connection.interface-name:              enp2s0
...
```

#### Set Device Management

```Bash
# Set device as 'unmanaged'
$ nmcli device set wlan0 managed false

# Set device as 'managed'
$ nmcli device set wlan0 managed true
```

#### Set DHCP for Connection

```Bash
# Sets connection 'SSID_NAME' to use DHCP for IPv4 address, subnet, and gateway
# Shorthand for 'nmcli connection modify'
$ nmcli c m SSID_NAME ipv4.method auto
```

#### Set Static IPv4 Info for Connection

```Bash
# Sets connection 'SSID_NAME' to use static IPv4 address, subnet, and gateway
# NOTE: The subnet mask is included in the address, here '/24'
# Shorthand for 'nmcli connection modify'
$ nmcli c m SSID_NAME \
    ipv4.method manual \
    ipv4.addresses 192.168.0.20/24 \
    ipv4.gateway 192.168.0.1
```

<!-- Querying WiFi Information -->

## Querying WiFi Information

**NOTE:** Most Linux systems use NetworkManager to manage and configure networking, including WiFi. See the [Managing Networking](#managing-networking-networkmanager) section for more details.

On Linux WiFi interfaces are created using a parent radio device, referred to as 'phys'. These radios come in a variety of form factors, including single radio, single phy and single radio, multi-phy. To view all system phys, run `ls /sys/class/ieee80211/`, which lists all `ieee80211` devices (WiFi phys). Supported interfaces, combinations, and settings depend on the radio firmware and associated Linux device driver. By default, a single WiFi interface is created per phy on system boot in 'managed' mode (WiFi station).

While most will be content with `NetworkManager` managing their WiFi interface settings, a more advanced user may find the `wpa_supplicant` and `hostapd` programs of interest. The program `wpa_supplicant` configures WiFi clients, whereas `hostapd` configures WiFi access points (APs, what most people refer to as a router). Both live under the `hostap` project and are widely used, including within tools like `NetworkManager` itself and within commercial APs as well. The configuration syntax is notoriously somewhat difficult, especially if you don't know the details of WiFi well.

#### Show WiFi Interface General Information

Includes STA MAC, SSID, phy device, channel, frequency, transmit power.

```Bash
$ iw wlan0 info
Interface wlan0
        ifindex 3
        wdev 0x1
        addr xx:xx:xx:xx:xx:xx
        type managed
        wiphy 0
        channel 48 (5240 MHz), width: 80 MHz, center1: 5210 MHz
        txpower 3.00 dBm
        multicast TXQ:
                qsz-byt qsz-pkt flows   drops   marks   overlmt hashcol tx-bytes        tx-packets
                0       0       0       0       0       0       0       0               0
```

#### Show WiFi Interface Link Information

**NOTE:** This command will only show meaningful output when the WiFi interface is connected (associated).

Includes AP MAC (if station), SSID, frequency, bandwidth, RSSI (if station), and phy rate (MCS),
among other things. Phy rate may or may not include NSS.

I often run this command in a loop while doing other testing using the commands in [this section](#run-command-every-n-seconds).

```Bash
# Anonymized MAC here is the AP's BSSID
$ iw wlan0 link
Connected to xx:xx:xx:xx:xx:xx (on wlan0)
        SSID: SSID_NAME
        freq: 5240
        RX: 2441322599 bytes (1762621 packets)
        TX: 37345389 bytes (416532 packets)
        signal: -60 dBm
        rx bitrate: 115.6 MBit/s VHT-MCS 5 short GI VHT-NSS 2
        tx bitrate: 104.0 MBit/s VHT-MCS 5 VHT-NSS 2

        bss flags:      short-slot-time
        dtim period:    1
        beacon int:     100
```

#### Show WiFi Interface Station Information

**NOTE:** This command will only show meaningful output when the WiFi interface is connected (associated).

This is effectively a combination of the `iw wlan0 info` and `iw wlan0 link` commands. For station interfaces,
this lists information related to the AP the station is associated with. In 802.11 terminology,
the station and AP are both stations, with the former (e.g. phone, laptop) being a non-AP station.

For AP interfaces, this list information for all stations associated to that AP interface.

```Bash
# Anonymized MAC here is the AP's BSSID
$ iw wlan0 station dump
Station xx:xx:xx:xx:xx:xx (on wlan0)
        inactive time:  2682 ms
        rx bytes:       47808905
        rx packets:     45274
        tx bytes:       11417769
        tx packets:     25222
        tx retries:     3001
        tx failed:      0
        beacon loss:    0
        rx drop misc:   0
        signal:         -42 [-43, -46] dBm
        signal avg:     -40 [-35, -45] dBm
        tx bitrate:     51.6 MBit/s 40MHz HE-MCS 2 HE-NSS 1 HE-GI 0 HE-DCM 0
        tx duration:    3694323 us
        rx bitrate:     458.8 MBit/s 40MHz HE-MCS 9 HE-NSS 2 HE-GI 0 HE-DCM 0
        rx duration:    3871820 us
        last ack signal:-39 dBm
        avg ack signal: -39 dBm
        airtime weight: 256
        authorized:     yes
        authenticated:  yes
        associated:     yes
        preamble:       long
        WMM/WME:        yes
        MFP:            yes
        TDLS peer:      no
        DTIM period:    3
        beacon interval:100
        short slot time:yes
        connected time: 777 seconds
        associated at [boottime]:       13.231s
        associated at:  1760385417521 ms
        current time:   1760386194555 ms
```

#### Show Channels Supported by WiFi Radio/Phy

```Bash
$ iw phy0 channels
Band 1:
        * 2412 MHz [1]
          Maximum TX power: 30.0 dBm
          Channel widths: 20MHz HT40+
        ...
        * 2467 MHz [12] (disabled)
        * 2472 MHz [13] (disabled)
        * 2484 MHz [14] (disabled)
Band 2:
        * 5180 MHz [36]
          Maximum TX power: 23.0 dBm
          Channel widths: 20MHz HT40+ VHT80
        ...
```

#### Show All WiFi Radio/Phy Info

This information is very verbose and includes channels and bands in current regulatory domain, ciphers, MCS rates, and antennas, and more.

```Bash
# Will show a 'Band 3', if supports 2.4 GHz, 5 GHz, and 6 GHz (varies by radio)
$ iw phy0 info
        ...
        Supported Ciphers:
            * WEP40 (00-0f-ac:1)
            * WEP104 (00-0f-ac:5)
            ...
        ...
        Band 1:
            ...
            Frequencies:
                * 2412 MHz [1] (30.0 dBm)
                * 2417 MHz [2] (30.0 dBm)
                ...
            ...
        Band 2:
            Frequencies:
                * 5180 MHz [36] (20.0 dBm)
                * 5200 MHz [40] (20.0 dBm)
                ...
            ...
        ...
```

#### Show Wireless Regulatory Domain Info

You may see a combination of system ('global') and per-radio ('self-managed') regulatory configuration.
The following shows both.

Per-radio regulatory configuration refers to regulatory domain configuration that the radio configures
on its own in the firmware/driver. Based on present conditions (e.g. beacons), the radio will override
the system regulatory domain, restricting the user to what the radio permits. In my experience, this
generally affects Intel radios (e.g. AX210, BE200).

```Bash
# Note the inclusion of sub-1GHz (WiFi HaLow, 802.11ah) and 60GHz (WiGig) spectrum
$ iw reg get
global
country US: DFS-FCC
        (902 - 904 @ 2), (N/A, 30), (N/A)
        (904 - 920 @ 16), (N/A, 30), (N/A)
        (920 - 928 @ 8), (N/A, 30), (N/A)
        (2400 - 2472 @ 40), (N/A, 30), (N/A)
        (5150 - 5250 @ 80), (N/A, 23), (N/A), AUTO-BW
        (5250 - 5350 @ 80), (N/A, 24), (0 ms), DFS, AUTO-BW
        (5470 - 5730 @ 160), (N/A, 24), (0 ms), DFS
        (5730 - 5850 @ 80), (N/A, 30), (N/A), AUTO-BW
        (5850 - 5895 @ 40), (N/A, 27), (N/A), NO-OUTDOOR, AUTO-BW
        (5925 - 7125 @ 320), (N/A, 12), (N/A), NO-OUTDOOR
        (57240 - 71000 @ 2160), (N/A, 40), (N/A)

phy#0 (self-managed)
country 00: DFS-UNSET
        (2402 - 2437 @ 40), (6, 22), (N/A), AUTO-BW, NO-HT40MINUS, NO-80MHZ, NO-160MHZ
        (2422 - 2462 @ 40), (6, 22), (N/A), AUTO-BW, NO-80MHZ, NO-160MHZ
        (2447 - 2482 @ 40), (6, 22), (N/A), AUTO-BW, NO-HT40PLUS, NO-80MHZ, NO-160MHZ
        (5170 - 5190 @ 160), (6, 22), (N/A), NO-OUTDOOR, AUTO-BW, IR-CONCURRENT, NO-HT40MINUS, PASSIVE-SCAN
        (5190 - 5210 @ 160), (6, 22), (N/A), NO-OUTDOOR, AUTO-BW, IR-CONCURRENT, NO-HT40PLUS, PASSIVE-SCAN
        (5210 - 5230 @ 160), (6, 22), (N/A), NO-OUTDOOR, AUTO-BW, IR-CONCURRENT, NO-HT40MINUS, PASSIVE-SCAN
        (5230 - 5250 @ 160), (6, 22), (N/A), NO-OUTDOOR, AUTO-BW, IR-CONCURRENT, NO-HT40PLUS, PASSIVE-SCAN
        (5250 - 5270 @ 160), (6, 22), (0 ms), DFS, AUTO-BW, NO-HT40MINUS, PASSIVE-SCAN
        (5270 - 5290 @ 160), (6, 22), (0 ms), DFS, AUTO-BW, NO-HT40PLUS, PASSIVE-SCAN
        ...
        (5590 - 5610 @ 160), (6, 22), (0 ms), DFS, AUTO-BW, NO-HT40PLUS, PASSIVE-SCAN
        (5610 - 5630 @ 160), (6, 22), (0 ms), DFS, AUTO-BW, NO-HT40MINUS, PASSIVE-SCAN
        (5650 - 5670 @ 80), (6, 22), (0 ms), DFS, AUTO-BW, NO-HT40MINUS, NO-160MHZ, PASSIVE-SCAN
        (5670 - 5690 @ 80), (6, 22), (0 ms), DFS, AUTO-BW, NO-HT40PLUS, NO-160MHZ, PASSIVE-SCAN
        (5690 - 5710 @ 80), (6, 22), (0 ms), DFS, AUTO-BW, NO-HT40MINUS, NO-160MHZ, PASSIVE-SCAN
        (5710 - 5730 @ 80), (6, 22), (0 ms), DFS, AUTO-BW, NO-HT40PLUS, NO-160MHZ, PASSIVE-SCAN
        (5735 - 5755 @ 80), (6, 22), (N/A), AUTO-BW, IR-CONCURRENT, NO-HT40MINUS, NO-160MHZ, PASSIVE-SCAN
        (5755 - 5775 @ 80), (6, 22), (N/A), AUTO-BW, IR-CONCURRENT, NO-HT40PLUS, NO-160MHZ, PASSIVE-SCAN
        (5775 - 5795 @ 80), (6, 22), (N/A), AUTO-BW, IR-CONCURRENT, NO-HT40MINUS, NO-160MHZ, PASSIVE-SCAN
        (5795 - 5815 @ 80), (6, 22), (N/A), AUTO-BW, IR-CONCURRENT, NO-HT40PLUS, NO-160MHZ, PASSIVE-SCAN
        (5815 - 5835 @ 20), (6, 22), (N/A), AUTO-BW, IR-CONCURRENT, NO-HT40MINUS, NO-HT40PLUS, NO-80MHZ,NO-160MHZ, PASSIVE-SCAN
```

## WiFi Configuration (Manual)

This section is more advanced and the commands here will almost certainly interfere
with any running network configuration daemons (e.g. NetworkManager).

#### Add Virtual WiFi Interface

The number and type of virtual interfaces varies both in terms of radio as well as driver/kernel.

```Bash
# Add station
$ iw phy0 interface add wlan0 type managed

# Add monitor
$ iw phy0 interface add moni0 type monitor

# Add AP
# When using 'hostapd', the interface to use can be a station (managed).
# The program will change the type as needed.
$ iw phy0 interface add moni0 type __ap
```

#### Change Virtual WiFi Interface Type

```Bash
# Change to station
$ iw wlan0 set type managed

# Change to monitor
$ iw wlan0 set type monitor

# Change to AP
$ iw wlan0 set type __ap
```

#### Delete Virtual WiFi Interface

```Bash
$ iw wlan0 del
```

#### Trigger WiFi Interface Scan

Combinations of the following are permissible. See the help output of `iw` for more info/options.

```Bash
# General scan, will send probe requests
$ iw wlan0 scan

# Scan on specific frequency/frequencies
$ iw wlan0 scan freq 2412 5180

# Directed scan for specific SSID (exclusive with passive scan)
$ iw wlan0 scan ssid SSIDNAME

# Passive scan, no probe requests (exclusive with specific SSID)
$ iw wlan0 scan passive
```

#### Rename WiFi Radio/Phy

```Bash
$ iw phy0 set name wiphy0
```

#### Move WiFi Radio/Phy to Network Namespace

**Exercise caution here**, as this will make the radio (and any virtual interfaces, e.g. 'wlan0')
visible only within the context of the network namespace. In other words, any WiFi interfaces
for the radio will no longer be visible via 'ip' unless you're running within the network namespace.
To move the radio back to the non-network namespace use, you will need to delete the network namespace.

Interestingly, network namespaces names don't exist in the kernel, only ID. Named network namespaces
appear to be a construct introduced by the 'iproute2' package (`ip` command) that is now defacto standard.
When creating named network namespaces, `ip` bind mounts to `/var/run/netns/` as part of the process.
More details [here](https://7bits.nl/journal/posts/what-does-ip-netns-add-actually-do/).

```Bash
# Specify netns by name
$ iw phy0 set netns name mynetns

# Specify netns by ID
$ iw phy0 set netns $NETNS_ID

# Show interfaces in network namespace (generally requires root permissions)
$ ip netns exec $NETNS_NAME ip link show

# Make radio available for non-network namespace use (requires deleting network namespace)
$ ip netns delete $NETNS_NAME
```

<!-- Querying DBus Information -->

## Querying DBus Information

#### List DBus Peers

```Bash
# The same output is displayed when just 'busctl' is run
$ busctl list
NAME    PID PROCESS         USER            CONNECTION    UNIT                     SESSION DESCRIPTION
:1.0    719 systemd-resolve systemd-resolve :1.0          systemd-resolved.service -       -
:1.1    718 systemd-oomd    systemd-oom     :1.1          systemd-oomd.service     -       -
:1.10   821 NetworkManager  root            :1.10         NetworkManager.service   -       -
:1.103 4099 busctl          lanforge        :1.103        session-3.scope          3       -
:1.15  1023 fwupd           root            :1.15         fwupd.service            -       -
...
```

#### Show DBus Peer Status

```Bash
# Can specify using either the 'UniqueName' identifier
# or the more human-readable DBus peer name
#
# Run just 'busctl status' to view main DBus socket status
$ busctl status org.freedesktop.ModemManager1
PID=805
...
Comm=ModemManager
CommandLine=/usr/sbin/ModemManager --debug
CGroup=/system.slice/ModemManager.service
Unit=ModemManager.service
Slice=system.slice
...
UniqueName=:1.7
EffectiveCapabilities=cap_net_admin cap_sys_admin
PermittedCapabilities=cap_net_admin cap_sys_admin
InheritableCapabilities=cap_sys_admin
BoundingCapabilities=cap_net_admin cap_sys_admin
```

#### Show DBus Peer Object Tree

```Bash
# Identifier is same as that used by 'busctl status'.
# See above for more information.
#
# Can specify more than one peer to list. For example,
# show trees for both the ':1.7' and ':1.10' peers:
#   busctl tree :1.7 :1.10
#
# Run just 'busctl' to view DBus tree for each DBus peer
# active on the system (may take some time to fully complete)
$ busctl tree org.freedesktop.ModemManager1
└─ /org
  └─ /org/freedesktop
    └─ /org/freedesktop/ModemManager1
      ├─ /org/freedesktop/ModemManager1/Modem
      │ └─ /org/freedesktop/ModemManager1/Modem/0
      └─ /org/freedesktop/ModemManager1/SIM
        └─ /org/freedesktop/ModemManager1/SIM/0
```

#### Introspect DBus Peer Object

```Bash
# Shows very verbose information on components of DBus peer object
#
# Here the object is '/org/freedesktop/ModemManager1/Modem/0', a cellular modem
# configured by the 'org.freedesktop.ModemManager1' DBus peer
$ busctl introspect org.freedesktop.ModemManager1 /org/freedesktop/ModemManager1/Modem/0
NAME                                TYPE      SIGNATURE RESULT/VALUE                             FLAGS
...
org.freedesktop.ModemManager1.Modem interface -         -                                        -
.Command                            method    su        s                                        -
.CreateBearer                       method    a{sv}     o                                        -
.DeleteBearer                       method    o         -                                        -
.Enable                             method    b         -                                        -
...
.CurrentBands                       property  au        57 5 6 7 8 9 10 12 31 32 33 34 35 37 38… emits-change
.CurrentCapabilities                property  u         204                                      emits-change
.CurrentModes                       property  (uu)      28 16                                    emits-change
...
.Drivers                            property  as        2 "option" "qmi_wwan"                    emits-change
.EquipmentIdentifier                property  s         "XXXXXXXXXXXXXXX"                        emits-change
.HardwareRevision                   property  s         "XXXXX"                                  emits-change
.Manufacturer                       property  s         "Quectel"                                emits-change
...
.MaxBearers                         property  u         1                                        emits-change
...
```
