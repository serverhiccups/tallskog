import { useEffect, useState } from "preact/hooks";

type BrowserType = "firefoxmac" | "other";

export const useBrowserType = () => {
	const [browserType, setBrowserType] = useState<BrowserType>("other");

	useEffect(() => {
		setBrowserType(
			navigator.userAgent.includes("Firefox") &&
				navigator.userAgent.includes("Macintosh")
				? "firefoxmac"
				: "other"
		);
	});

	return [browserType];
};
