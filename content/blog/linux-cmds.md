+++
title = "Linux Command Cheatsheet"
date = "2023-12-26"

#[taxonomies]
#tags = ["linux", "sysadmin"]
+++

<!-- General commands -->
<!-- TODO: grep w/ regex -->

## General Commands

These commands aren't necessarily Linux machine-specific, but they may come in handy when using one.

#### Run Command Every N Seconds

```Bash
# Prints 'Vale la pena' once every half second
$ watch -n 0.5 echo 'Vale la pena'
```

#### View File Contents as File Updates

```Bash
# The '-F' option may be useful as well. See 'man tail'
$ tail -f lanforge_log_1.txt
```

#### Search for File

```Bash
# The '.' here specifies to search in and all sub-directories of the '$CWD'
$ find . -name "\*.html"
./blog.html
./projects.html
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
$ sudo dmesg
```

<!-- System Administration: Systemd -->

## System Administration: Systemd

<!-- TODO: systemctl commands (status, start/stop/restart, daemon-reload, enable/disable, edit)-->

#### Show Systemd Unit Status

```Bash
# The '.service' is optional if there are no other Systemd units w/ same name
# The bottom of the output is the same as would be output by 'journalctl -b -0 -u NetworkManager-wait-online'
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

```Bash
# TODO
# start
# stop
# restart
# enable, disable
# mask, unmask
# edit
# daemon-reload
```

#### View Service (Daemon) Logs

```Bash
# Prints all log lines. Will be very long
$ journalctl

# Print only the last 100 log lines
$ journalctl -n 100

# Follow logs in real time (similar to 'tail -f')
$ journalctl -f

# Only show logs for a specific ID, here 'test_program'.
# For example, the following would create a log message and
# tag it with the 'test_program' tag:
# logger -t test_program "This is a log message"
#
# Note that this is different from the '-u' option
$ journalctl -t test_program

# Only show logs for a specific service, here, 'wpa_supplicant.service'
$ journalctl -u wpa_supplicant
# or
$ journalctl -u wpa_supplicant.service

# Only show logs for this boot (can use '-b' option instead of '--boot')
$ journalctl --boot -0

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

**NOTE:** These commands are listed for diagnostic purposes.
You probably want to use Network Manager to configure your networking instead.
See the [next section](#managing-networking-network-manager) for more details.

Most Linux distributions run Network Manager to configure and manage networking nowadays. This is a common point of confusion, as there is still material available online which assumes older, network-scripts based network management.

It is possible to configure networking with variations of these commands. Unless you know
what you're doing, though, you're better off just using Network Manager.

#### Show Network Interface Link-Layer Info</h3>

Displays interface status and MAC address. More detailed output is possible by
using the `-d` option (without the `-br` option).

**NOTE:** Take note of information beyond MAC address. 'UP' indicates interface is running. 'LOWER_UP' means the driver is functioning. For example, a non-configured but plugged in ethernet device may be 'DOWN' but 'LOWER_UP'. For Ethernet interfaces, 'NO-CARRIER' indicates that there is no signal on the wire (it's disconnected).

```Bash
# Shorthand shown. Full command would be 'ip link show', but the 'show' is optional.
$ ip -br l
lo               UNKNOWN        00:00:00:00:00:00 <LOOPBACK,UP,LOWER_UP>
enp2s0           DOWN           xx:xx:xx:xx:xx:xx <NO-CARRIER,BROADCAST,MULTICAST,UP>
wlan0            UP             xx:xx:xx:xx:xx:xx <BROADCAST,MULTICAST,UP,LOWER_UP>
```

#### Show Network Interface IP-Layer Info

Displays IPv4 and IPv6 information in addition to interface status, MAC address, MTU, and interface routing table, among other things (some of which require `-d` option). More detailed output is possible by using the `-d` option (without the `-br` option).

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

## Managing Networking (Network Manager)

At a high level, Network Manager configures 'connections' which are established using a backing network interface, or in Network Manager terms, 'device'. These devices are either managed or unmanaged from the perspective of Network Manager.

Generally, most users will be fine with Network Manager configuring all of their
network interfaces, typically only WiFi and Ethernet (although Network Manager can do much more). There are times, though, where it is appropriate to have Network Manager [ignore specific interfaces](#set-device-management), for example, when doing WiFi packet capture.

This section details some of the most basic and more-useful (from my perspective) commands. See `man nmcli-examples` for more examples and more advanced usage of Network Manager.

#### Show All Devices

Shows all Network Manager-tracked network devices, including both devices
that are managed and unmanaged by Network Manager.

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

When typing `nmcli connection` commands, active connections will tab complete, but sadly inactive connections do not.

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
Show Specific Connection Info will provide more information, assuming there is a connection which uses the device.

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

**NOTE:** Just as the [Querying Network Information](#querying-network-information) section details, most Linux systems use Network Manager to manage and configure networking, including WiFi. See the [Managing Networking](#managing-networking-network-manager) section for more details.

#### Show WiFi Interface General Info

Includes STA MAC, SSID, phy device, channel, frequency, transmit power.

```Bash
# Can also run 'iw dev wlan0 info', but 'dev' is optional
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

Includes AP MAC (if station), SSID, frequency, bandwidth, RSSI (if station), and phy rate (MCS),
among other things. Phy rate may or may not include NSS.

```Bash
# Can also run 'iw dev wlan0 link', but 'dev' is optional
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

#### Show WiFi Radio Info

Includes channels and bands in current regulatory domain, ciphers, MCS rates, and antennas, among other things.

```Bash
# Can also run 'iw phy phy0 info', but 'phy' is optional
# Will show a 'Band 3', if supports 2.4 GHz, 5 GHz, and 6 GHz
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

```Bash
$ iw reg get
global
country 00: DFS-UNSET
        (2402 - 2472 @ 40), (6, 20), (N/A)
        (2457 - 2482 @ 20), (6, 20), (N/A), AUTO-BW, PASSIVE-SCAN
        (2474 - 2494 @ 20), (6, 20), (N/A), NO-OFDM, PASSIVE-SCAN
        (5170 - 5250 @ 80), (6, 20), (N/A), AUTO-BW, PASSIVE-SCAN
        (5250 - 5330 @ 80), (6, 20), (0 ms), DFS, AUTO-BW, PASSIVE-SCAN
        (5490 - 5730 @ 160), (6, 20), (0 ms), DFS, PASSIVE-SCAN
        (5735 - 5835 @ 80), (6, 20), (N/A), PASSIVE-SCAN
        (57240 - 63720 @ 2160), (N/A, 0), (N/A)
```
