+++
title = "WiFi WPA3 Compatibility Mode Woes"
date = "2025-04-10"
description = ""

#[taxonomies]
#tags = ["linux", "wifi", "hostap"]
+++

## Overview

TTTT <coda class="p-1 rounded-sm border bg-zinc-100">Test test</coda> Tesssst
TTTT <coda class="p-1 rounded-md border bg-zinc-100">Test test</coda> Tesssst

Recently, a customer at [_$JOB_](https://candelatech.com) reached out to highlight a strange issue when
using our platform to test their WiFi 7 access point (AP). When their AP device under test (DUT) was configured
to WPA3 Personal Compatibility Mode, a recently introduced in the [WPA3 Specification](https://www.wi-fi.org/wi-fi-download/35332/0), 
they reported steep drops in throughput and high packet loss. Notably, this issue was not present with
a third-party Android phone.

As one of the primary engineers addressing customer issues and queries at `$JOB`, I field a variety of queries.
In scenarios like this, I approach the problem assuming our product is not functioning correctly. While
not always the case, we work with a variety of highly-technical networking equipment vendors and users,
so it's generally safe to assume they've done their homework. As we'll see later, though, the issue here
was buried deep in the Wi-Fi stack and spanned across both our test equipment and the customer device.

This post will cover some general information on Wi-Fi and device testing, including a primer on Wi-Fi personal security
modes. It assumes general knowledge of networking and a bit of Linux (if you'd like to set this up yourself). Thanks to
my colleagues Ben Greear, Isaac Konikoff, and Madhan Sai for their help in identifying and assisting in addressing this issue.

## On Device Testing

**NOTE:** This section covers general information on WiFi device testing. Skip ahead to read more about the issue in question.

In testing scenarios like the one which lead to this customer report, the organization performing testing has pre-existing
expectations for how their device should function under test. Generally, they are concerned with their own KPIs, metrics
which should be continually achieved as their device progresses through its lifecycle. Any deviation can indicate
a regression or failure in the product. Thus, ensuring a reproducible and stable test configuration is essential,
regardless of the product type.

For wireless and Wi-Fi testing specifically, the most reproducible test configuration occurs when the device
and wireless portion of the test environment lives in an RF-isolated test chamber. Of course, other test
configurations also have value, such as test houses or simple on-your-desk testing. Test houses, for example,
can better reflect a real-world test environment. That said, these methods suffer from drawbacks, both in terms
of reproducibility and difficulty to scale, making RF-isolated testing very common.

In this scenario, the reported issue took place in a fairly simple single RF chamber configuration,
with the AP sitting alongside one of our test systems inside the chamber. While not ideal for some of the precise
testing AP DUTs may also require, this configuration lies at the intersection of high utility/reproducibility
and low cost/difficulty to scale, making it very common for both manual and automated testing of any scope.

In such a test environment, one can reasonably expect to achieve substantially higher throughput than in the
real world. Theoretical rates aside, I've seen APs easily transmit and receive higher than 5 or 6 Gbps
over the air (OTA) with the latest WiFi 7 AP-grade chipsets. However, in this testing scenario the customer
reported drastically low throughput and high packet loss. We're talking drops from 1 Gbps, as configured, down to
as low as 20 Mbps, just by changing the security mode. Packet drop rate also increased from 0% to up to 70% with UDP traffic
(recall that UDP is an unreliable protocol with no form of rate control, unlike TCP). Mind you, this is all taking
place in a pristine test environment. There's no airtime contention to blame for this one!

While not always the case, we work closely with this customer and had their AP already in hand. Additionally,
`wpa_supplicant` and `hostapd`, which our product uses under the hood, both support WPA3 Personal Compatibility
Mode as of v12 (still under development as of April 2025). Working with my colleague [Madhan Sai](https://in.linkedin.com/in/madhan-sai-3010b0211),
we sat down and got to work reproducing the issue in our lab.

## WPA3 Personal Compatibility Mode

Before diving into the details of our testing, I'd like to skim the surface of Wi-Fi security, *specifically
Wi-Fi personal authentication* and the differences between the different modes. If you're familiar, skip
ahead to the next section, as this will mostly be review, save the WPA3 Personal Compatibility Mode discussion.

In modern Wi-Fi security, the EAPOL four-way handshake serves as one of the essential components for authenticating
and authorizing a new client (EAPOL stands for Enhanced Authentication Protocol over LAN, that's a mouthful).
This process is well documented [elsewhere](https://www.cwnp.com/uploads/802-11i_key_management.pdf), but generally
it serves to transfer required key material and encryption information required to establish an authorized and
authenticated client session with the Wi-Fi network. Enterprise configurations generally require more steps, but for
personal mode networks where scale is small, the EAPOL four-way handshake is sufficient and straightforward.

During the four-way handshake, the AP first transmits its Authenticator Nonce (ANonce) to the client.
The client then responds with its Supplicant Nonce (SNonce). This response includes an embedded Robust
Security Network (RSN) information element (IE) describing the client's chosen cipher suites and
key management suites. These options are assumed supported by the AP (we'll come back to that soon), and
the embedded IE largely matches what one might see in a beacon or probe response frame RSN IE.

In WPA2 mode networks, the embedded EAPOL frame RSN IE usually includes some variation of CCMP for the
pairwise and group cipher suites and PSK for authentication key management suite (AKM). In contrast,
WPA3 networks swap one of SAE or SAE-EXT-KEY for the AKM and GCMP-256 for the pairwise and group cipher
suites when using SAE-EXT-KEY AKM. These settings are true regardless of if the AP is configured for WPA2 Personal,
WPA3 Personal, WPA3 Personal Transition Mode, or WPA3 Personal Compatibility Mode. However, things get
more interesting before the four-way handshake.

While the four-way handshake serves key role in Wi-Fi security, the full process arguable starts much earlier when
the client scans and associates to the AP.

<!--
In modern Wi-Fi security, the client performs a four-way handshake with the authenticator as one of the first steps
in the association process. The full security process, which includes the four-way handshake, serves to authenticate
and authorize the client for access to the network. This post focuses on *personal* Wi-Fi security modes,
which complete this process in the four-way handshake more or less. Enterprise networks generally require
additional steps.

In personal Wi-Fi security modes, the four-way handshake key material required to establish an authorized/authenticated client session

Back in the days when Wi-Fi still encountered interference from microwave ovens, Wi-Fi security began with the introduction of
the WEP security protocol. Included as part of the original IEEE 802.11 specification released in 1997, WEP was quickly found
to be insecure to a variety of attacks. As an interim replacement, the Wi-Fi Alliance (WFA) introduced the Wi-Fi Protected Access (WPA) 
standard (synonymous w/ TKIP, Temporal Key Integration Protocol) while members of the IEEE worked to ratify WPA2 as part of the
IEEE 802.11i standard. PA is now known to be an insecure security mode and nowadays practically all devices support WPA2,
so please *don't use WPA or WEP*.

Note that the IEEE and WFA are two distinct organizations with vested interests in advancing Wi-Fi. The IEEE 
convenes members of the technical community to develop new specifications for Wi-Fi. Not all of the specification
makes its way into the real world. What does is largely included in the WFA's specifications, as they work
to certify devices based on their specifications (e.g. WPA2 and WPA3).

As an aside, around the same time a competing standard called WLAN Authentication and Privacy Infrastructure (WAPI) was
introduced and at one point required in the Chinese domestic market. This lead to some trade disputes between nations and
even the original iPhone being released in China [without Wi-Fi connectivity](https://web.archive.org/web/20090712235526/http://www.businessweek.com/technology/ByteOfTheApple/blog/archives/2009/07/apple_will_stri.html).
It's unclear to me whether this is still required or not, but it's certainly been around for quite awhile now.

**If keep above fine otherwise edit introductory statement here
Okay, back to other, more internationally-used standards. Introduced in the IEEE 802.11i standard released in 2004, the
IEEE unveiled its next generation of Wi-Fi security specification, detailing a framework for authentication and authorization
This more robust framework is the namesake for the WFA's WPA2 specification, known as Robust Security Network, or RSN for short.
As noted in [this](https://www.cwnp.com/uploads/802-11i_key_management.pdf) white paper from the CWNP, the IEEE 802.11i
specification describes much of what constitutes WPA2 and 802.1X/EAP generally. However, much of the specifics are strewn
across several Internet Engineering Task Force (IETF) RFCs, primarily for EAP-based security.
-->


- Wi-Fi security started w/ WEP, found to be insecure very soon after introduction
- WPA introduced w/ TKIP security protocol
   - Intended to be transitional from insecure WEP while 802.11i finalized
   - Note competing Chinese standard WLAN Authentication and Privacy Infrastructure (WAPI)
   - Vulnerable to packet injection and spoofing (source this)
- WPA2 introduced w/ 802.11i (RSN)
   - Introduces AES (128 bit key) and CCMP 
   - Personal authentication setup allows for other users who know password to decrypt traffic from other clients
      - Need to capture four-way handshake
      - Haven't tried but can theoretically force target deauthentication,
        forcing it to potentially reconnect and perform handshake again

- WPA3 improved security (PMF required, better encryption, SAE so can't decrypt capture w/ just password)
- Not all clients capable of WPA3 (legacy)
- WPA3 Transition Mode introduced to support transition of networks from older WPA2 to more-secure WPA3
   - **VERIFY:** Possibly clients can't parse multiple AKMs in RSN IE
- WPA3 Personal Compatibility mode introduced to better support legacy clients
   - RSN overrides in separate WFA vendor-specific IE
