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

- [ ] Improve Layout query efficiency
- [ ] Keyboard shortcuts
- [ ] Features, (ie. [+uD], [+topic], etc)
- [ ] template system
- [ ] copy and paste
- [ ] New automatic layout system
    - [X] Bring in flextree
    - [ ] Investigate how arrows are typically used
    - [ ] Add arrow layout into the FlexTreeLayout
    - [ ] Draw labels in the correct place on arrows
- [ ] Allow arrows to be added with the mouse
- [ ] Allow labels to be added to arrows
- [ ] Saving and loading
- [ ] Add option for a triangle link to a single child (eg. for omitting the internal structure of a DP)
- [ ] Ability to change diagram font
- [ ] Standalone commandline tool
- [ ] Homepage / Landing splash
- [ ] Image export
    - [ ] SVG export
    - [ ] PNG export
- [ ] Branding
- [ ] Support for embedding into Typst / LaTeX
- [ ] Automatic local backups (to help prevent issues with any accidental loss / corruption)
- [ ] Check cross-browser compatibility
- [ ] Check touch screen support (iPad)
- [ ] Help / Documentation
    - [ ] Documentation page
    - [ ] In-editor hints
- [ ] Import from Treeform
		

## Licence

Tallskog is licensed under Creative Commons Attribution-NonCommercial-ShareAlike 4.0. For more information see `LICENCE`
