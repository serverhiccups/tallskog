# Tallskog

Tallskog is an experimental syntax tree editor for syntax analysis. It is currently alpha and not recommended for use.
A version of Tallskog is available at [tallskog.hiccup01.com](https://tallskog.hiccup01.com)

## Building

You will need a modern version of NodeJS and scss installed. Then run

```bash
yarn install
```

to install dependencies.
To run the project for development, run

```bash
yarn dev
```

## To-do

### Core Diagram Functionality
- [ ] New automatic layout system
    - [X] Bring in flextree
    - [X] Investigate how arrows are typically used
    - [X] Add arrow layout into the FlexTreeLayout
    - [X] Figure out what to do when the target of an arrow has a direct child
    - [X] Permit drawing of arrows between trees
    - [X] Draw arrow heads
    - [ ] Tighten the fit of arrows around obstacles
    - [ ] Draw labels on arrows
- [ ] Allow arrows to be added with the mouse
- [ ] Allow labels to be added to arrows
- [ ] Allow canvas to be scrolled
- [ ] Features, (ie. [+uD], [+topic], etc)
- [ ] Add option for a triangle link to a single child (eg. for omitting the internal structure of a DP)
- [ ] Ability to change diagram font
### UI Functionality
- [ ] Keyboard shortcuts
- [ ] Saving and loading
- [ ] template system
- [ ] copy and paste
- [ ] Standalone commandline tool
- [ ] Image export
    - [ ] SVG export
    - [ ] PNG export
- [ ] Check touch screen support (iPad)
- [ ] Import from Treeform
### Branding
- [ ] Homepage / Landing splash
- [ ] Branding
- [ ] Support for embedding into Typst / LaTeX
- [ ] Help / Documentation
    - [ ] Documentation page
    - [ ] In-editor hints
### Other
- [ ] Improve Layout query efficiency
- [ ] Check cross-browser compatibility
- [ ] Automatic local backups (to help prevent issues with any accidental loss / corruption)
		

## Licence

Tallskog is licensed under Creative Commons Attribution-NonCommercial-ShareAlike 4.0. For more information see `LICENCE`
