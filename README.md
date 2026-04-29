# Your Project's Title...
Your project's description...

## Environments
- Preview: https://main--{repo}--{owner}.aem.page/
- Live: https://main--{repo}--{owner}.aem.live/

## Documentation

Before using the aem-boilerplate, we recommand you to go through the documentation on https://www.aem.live/docs/ and more specifically:
1. [Developer Tutorial](https://www.aem.live/developer/tutorial)
2. [The Anatomy of a Project](https://www.aem.live/developer/anatomy-of-a-project)
3. [Web Performance](https://www.aem.live/developer/keeping-it-100)
4. [Markup, Sections, Blocks, and Auto Blocking](https://www.aem.live/developer/markup-sections-blocks)

## Installation

```sh
npm i
```

## Linting

```sh
npm run lint
```

## Local development

1. Create a new repository based on the `aem-boilerplate` template
1. Add the [AEM Code Sync GitHub App](https://github.com/apps/aem-code-sync) to the repository
1. Install the [AEM CLI](https://github.com/adobe/helix-cli): `npm install -g @adobe/aem-cli`
1. Start AEM Proxy: `aem up` (opens your browser at `http://localhost:3000`)
1. Open the `{repo}` directory in your favorite IDE and start coding :)

## Holiday Planner - How to use

The planner helps you track yearly holiday allowance, planned ranges, and used ranges.

### 1. Set your yearly total

1.1. In **Max holiday days for the year**, enter your yearly allowance (for example `25`).
1.2. Click **Add max days**.

### 2. Add holiday periods

2.1. In **Add holiday period**, select a date range in the calendar (or type `YYYY-MM-DD - YYYY-MM-DD`).
2.2. Click **Add period**.
2.3. The range appears in the **Date range** table with its working-day count.

Notes:
- Days are counted as working days only (weekends are excluded).
- Built-in bank holidays are excluded from day count.
- In **Manual holidays mode**, click dates in the calendar to include/exclude custom holidays.

### 3. Mark periods as used

3.1. In the date range table, enable the **Used** checkbox for periods already taken.
3.2. Leave unchecked for future/planned periods.

### 4. Read the summary table

- **Used days**: sum of periods marked as used.
- **Planned/Upcoming days**: sum of periods not marked as used.
- **Unplanned days**: days with no period in the date range table.
	- Formula: `total days - used days - planned/upcoming days`.
- **Days left**: `total days - used days`.
- **Total days**: your configured yearly max.

### 5. Save, export, import, and reset

- Use the actions menu (three-line button) to:
	- **Save** data to browser local storage.
	- **Export JSON** to download your planner data.
	- **Import JSON** to restore from an exported file.
	- **Clear saved data** to remove local storage data.
- Use **Clear all** to reset the planner in the current page session.
