/** EventTarget includes non-nodes; Obsidian's node check works across windows. */
export function isHTMLElement(target: EventTarget | null): target is HTMLElement {
	return (target as Node | null)?.instanceOf?.(HTMLElement) === true;
}
