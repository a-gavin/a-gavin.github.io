+++
title = "Linux Home Router w/ Open Source Tools"
date = "2024-06-05"
description = ""

#[taxonomies]
#tags = ["linux", "networking", "wifi"]
+++

Having recently received a couple of hand-me-down mini-ITX firewall-type systems, I figured I'd challenge myself to replace my commercial home router and access point with one of the systems.

I initially embarked on this journey using NetworkManager. To do so, I configured a Fedora system with `dhcpd`, `nftables`, and `NetworkManager`, jotting down the configuration in step-by-step configuration notes. This setup has performed great for the past several months doing simple Ethernet-only routing, but it felt cumbersome and error-prone (plus I wanted to integrate WiFi).

Since then, I evolved this project to make it more easily-reproducible and flexible to different configurations. The project continues to use `dhcpd` and `nftables` but also leverages new tools as well. An Ansible playbook replaces configuration notes, and `systemd-networkd` takes the place of NetworkManager. I also introduced `hostapd` to optionally configure WiFi access points and Vagrant to streamline testing the Ansible playbook.

This project is available [here](https://github.com/a-gavin/linux-home-router) on my GitHub and includes setup instructions in the [README](https://github.com/a-gavin/linux-home-router/blob/main/README.md). It currently supports Fedora and Ubuntu, but that may change in the future as I explore new tools to accomplish this.

To set this up on your own system, I recommend at least being familiar with [these commands](http://a-gavin.github.io/blog/linux-cmds/#querying-network-information), in addition to Linux generally. Please reach out if you have any questions!