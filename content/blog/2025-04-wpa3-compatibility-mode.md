+++
title = "WiFi WPA3 Compatibility Mode Woes"
date = "2025-04-10"
description = ""
path = "blog/wpa3-compatibility-mode"

draft = true

#[taxonomies]
#tags = ["linux", "wifi", "hostap"]
+++

## Overview

Recently, a customer at [_$JOB_](https://candelatech.com) reached out to highlight a concerning issue when
using our platform to test their WiFi 7 *access point* (AP). When their AP *device under test* (DUT) was configured
to WPA3 Personal Compatibility Mode, a recently introduced in the [WPA3 Specification](/blog/2025-04-wpa3-compatibility-mode/wfa_wpa3_specification_v3.5.pdf),
they reported drastic drops in throughput and high packet loss. Notably, this issue was not present when testing
with a third-party Android phone.

This post serves to document this issue, in addition to providing a primer on WPA3 Compatibility Mode.
I assume general knowledge of basic WiFi concepts (primarily client connection), basic networking, and
Linux familiarity (assuming you'd like to set this up yourself). If you're not familiar or need a refresher,
I encourage you to review [this list of definitions](@/blog/2023-10-wifi-packet-capture.md#definitions)
as well as the WiFi client connection process.

Thanks to my colleagues Ben Greear, Isaac Konikoff, and Madhan Sai for their help in identifying and assisting in
addressing this issue.

<!---
As one of the primary engineers addressing customer issues and queries at `$JOB`, I field a variety of queries.
In scenarios like this, I approach the problem assuming our product is not functioning correctly. While
not always the case, we work with a variety of highly-technical networking equipment vendors and users,
so it's generally safe to assume they've done their homework. As we'll see later, though, the issue here
was buried in the WiFi stack and spanned across both our test equipment and the customer device.
--->

## On Device Testing

**NOTE:** This section covers general information on WiFi device testing. Skip ahead to read more about the issue in question.

In testing scenarios like the one which lead to this customer report, the organization performing testing has pre-existing
expectations for how their device should function. Aside from basic sanity checks, they are generally concerned
with their own KPIs. These are metrics which should be continually achieved as their device progresses through its lifecycle.
Any deviation can indicate a regression or failure in the product. Thus, ensuring a reproducible and stable test configuration
is essential, regardless of the product type.

For wireless and WiFi testing specifically, **the most reproducible test configuration occurs when the device
and wireless portion of the test environment lives in an RF-isolated test chamber**. Of course, other test
configurations also have value, such as test houses or simple on-your-desk testing. Test houses, for example,
can better reflect a real-world test environment. However, these methods suffer from drawbacks, both in terms
of reproducibility and difficulty to scale, making RF-isolated testing very common.

In this specific scenario, **the reported issue took place in a fairly simple configuration, with the AP sitting
alongside one of our test systems inside a single RF chamber**. While not ideal for some of the precise
testing AP DUTs may also require, this configuration lies at the intersection of high utility and reproducibility
but low cost and difficulty to scale, making it very common for both manual and automated testing of any scope.

In such a test environment, one can reasonably expect substantially higher throughput than in the
real world. Theoretical rates aside, I've seen APs easily transmit and receive in the multi-gigabit range
*over the air* (OTA) with the latest WiFi 7 chipsets. However, in this testing scenario the customer
reported drastic reductions in throughput and increases in packet loss. **For a test configured to 1 Gbps
download traffic, say, throughput dropped from 1Gbps to as low as 20 Mbps, simply by changing the security mode.**
Additionally, UDP traffic tests showed drastic increases in packet drop from around 0%
to up to 70%. TCP used rate control to more intelligently adjust the rate down after a brief initial period of packet loss.

While not always the case, we work closely with this customer and had their AP already in hand. Additionally,
`wpa_supplicant` and `hostapd`, which our product uses under the hood, both support WPA3 Personal Compatibility
Mode as of v12. Working with my colleague [Madhan Sai](https://in.linkedin.com/in/madhan-sai-3010b0211),
we got to work reproducing the issue in our lab.

## Modern WiFi Security Modes

### WPA2-only and WPA3-only

In order to better understand the issue at hand, one must first understand what comprises the different WiFi
security modes.

To connect a client device like a phone or laptop to a WiFi network, the client device and AP follow a series of
well-defined steps which, upon successful completion, permit the device to use the WiFi network. These
steps are outlined in the various IEEE 802.11 and Wi-Fi Alliance specifications and generally boil down to a few
core steps for personal mode authentication WiFi networks--the kind you generally find in the home or a small business.

To enable this process, **the AP will configure its security information in the *Robust Security Network* (RSN)
*information element* (IE)** when operating in standard WPA2-only or WPA3-only mode. This IE is SSID-specific and present
in beacon and probe response frames from the AP. It includes information on the supported security configuration
for the given SSID (multiple SSIDs may be configured on a single AP). These settings include *authentication
key management* (AKM) suite(s), cipher suites, and *protected management frame* (PMF) support, among other things.
Additional information may be present in the *RSN eXtension* IE, which in addition to beacon and probe response frames
is also included in association response frames.

Similarly for clients, **the client-selected security configuration is present in association request frames.**
These are transmitted after the client chooses the SSID and AP to connect to and validates that the SSID supports
the desired security configuration. The same client security information is also present in the second EAPOL
frame in the four-way handshake, specifically embedded within the *WPA Key Data* section.

In standard WPA2-only and WPA3-only mode, **the AP RSN IE will contain a single AKM suite.** For WPA2, this suite
is always type *Pre-Shared Key* (PSK). For WPA3, this suite is generally type *Simultaneous Authentication of Equals* (SAE).
Example beacon frame RSN IEs are available for WPA2-only [here](/blog/2025-04-wpa3-compatibility-mode/beacon_wpa2_security.png) and WPA3-only [here](/blog/2025-04-wpa3-compatibility-mode/beacon_wpa3_security.png).

### WPA3 Transition Mode

Given that WiFi deployments will continue to support WPA2-only client devices for some time to come, the Wi-Fi
Alliance introduced WPA3 Transition Mode security. As with anything WiFi, backwards compatibility is forefront
with any new changes. Thus, this security mode aims to balance the need for supporting WPA2-only with the desire
to shift clients to the more secure WPA3.

To do so, WPA3 Transition Mode simply configures the AP RSN IE with the AKM suites present in both WPA2-only
and WPA3-only configurations, namely AKM types PSK and SAE. This allows the client device to choose whichever
it maximally supports during the association process.

{{ image(src="/blog/2025-04-wpa3-compatibility-mode/beacon_wpa3_transition_mode_security.png", caption="AP Beacon WPA3 Transition Mode Security IEs", alt="Image of AP beacon frame WPA3 transition mode RSN and RSN eXtension IEs") }}


<!--
the AP will configure its security information primarily in the "Robust Security Network"
(RSN) Information Element (IE), which is present in beacon, probe response, and association response frames.

Note that "connect"
here simply means "associate" (in WiFi terms). Configuring IP addresses, DNS, etc, while generally required for
normal device usage, is not part of the IEEE 802.11 specification and thus outside of the scope of this post.

In modern WiFi security, the EAPOL four-way handshake serves as one of the essential components for authenticating
and authorizing a new client for access to the WiFi network (EAPOL stands for Enhanced Authentication Protocol over LAN,
that's a mouthful). This process is well documented [by CWNP](/blog/2025-04-wpa3-compatibility-mode/802-11i_key_management.pdf),
but generally it serves to transfer the required key material and encryption information required to establish an authorized
and authenticated client session with the WiFi network. In other words, a successful four-way handshake allows a client device
to connect to and use the WiFi network selected. Enterprise configurations generally require more steps, but for
personal mode networks, like the home or small business, where scale and risk is (hopefully) small, the EAPOL four-way
handshake is sufficient to.

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

While the four-way handshake serves key role in WiFi security, the full process arguable starts much earlier when
the client scans and associates to the AP.

In modern WiFi security, the client performs a four-way handshake with the authenticator as one of the first steps
in the association process. The full security process, which includes the four-way handshake, serves to authenticate
and authorize the client for access to the network. This post focuses on *personal* WiFi security modes,
which complete this process in the four-way handshake more or less. Enterprise networks generally require
additional steps.

In personal WiFi security modes, the four-way handshake key material required to establish an authorized/authenticated client session

Back in the days when WiFi still encountered interference from microwave ovens, WiFi security began with the introduction of
the WEP security protocol. Included as part of the original IEEE 802.11 specification released in 1997, WEP was quickly found
to be insecure to a variety of attacks. As an interim replacement, the WiFi Alliance (WFA) introduced the WiFi Protected Access (WPA)
standard (synonymous w/ TKIP, Temporal Key Integration Protocol) while members of the IEEE worked to ratify WPA2 as part of the
IEEE 802.11i standard. PA is now known to be an insecure security mode and nowadays practically all devices support WPA2,
so please *don't use WPA or WEP*.

Note that the IEEE and WFA are two distinct organizations with vested interests in advancing WiFi. The IEEE
convenes members of the technical community to develop new specifications for WiFi. Not all of the specification
makes its way into the real world. What does is largely included in the WFA's specifications, as they work
to certify devices based on their specifications (e.g. WPA2 and WPA3).

As an aside, around the same time a competing standard called WLAN Authentication and Privacy Infrastructure (WAPI) was
introduced and at one point required in the Chinese domestic market. This lead to some trade disputes between nations and
even the original iPhone being released in China [without WiFi connectivity](https://web.archive.org/web/20090712235526/http://www.businessweek.com/technology/ByteOfTheApple/blog/archives/2009/07/apple_will_stri.html).
It's unclear to me whether this is still required or not, but it's certainly been around for quite awhile now.

**If keep above fine otherwise edit introductory statement here
Okay, back to other, more internationally-used standards. Introduced in the IEEE 802.11i standard released in 2004, the
IEEE unveiled its next generation of WiFi security specification, detailing a framework for authentication and authorization
This more robust framework is the namesake for the WFA's WPA2 specification, known as Robust Security Network, or RSN for short.
As noted in [this](https://www.cwnp.com/uploads/802-11i_key_management.pdf) white paper from the CWNP, the IEEE 802.11i
specification describes much of what constitutes WPA2 and 802.1X/EAP generally. However, much of the specifics are strewn
across several Internet Engineering Task Force (IETF) RFCs, primarily for EAP-based security.

- WiFi security started w/ WEP, found to be insecure very soon after introduction
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
-->