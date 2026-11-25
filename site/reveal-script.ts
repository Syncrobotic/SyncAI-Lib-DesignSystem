/**
 * Before anything paints: says that scripts run and the page is not being captured by an automated browser. Only then may
 * a showcase section start hidden ([data-js] in globals.css), so a page without scripts, or a screenshot tool, never sees
 * a blank section.
 */
export const revealScript = `if(!navigator.webdriver)document.documentElement.setAttribute("data-js","")`
