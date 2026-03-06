import posthog from 'posthog-js'

const posthogToken =
	import.meta.env.PUBLIC_POSTHOG_KEY ||
	'phc_tSWcZA6Jjtg6WE7Wp8shd5XQpentWC963XfQi4UeNT2'
const posthogHost = import.meta.env.PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'

let hasInitialized = false

export function initAnalytics() {
	if (hasInitialized || !posthogToken) return

	posthog.init(posthogToken, {
		api_host: posthogHost,
		autocapture: false,
		capture_pageview: true,
		capture_pageleave: true,
		persistence: 'localStorage+cookie',
	})

	hasInitialized = true
}

export function trackEvent(eventName: string, properties?: Record<string, unknown>) {
	if (!hasInitialized) return
	posthog.capture(eventName, properties)
}

