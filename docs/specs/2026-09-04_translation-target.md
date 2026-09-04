# Notes: choose the target language, never translate into the source

**Status: implemented 2026-09-04** (owner, after the API key was fixed:
"musimy mieć możliwość wybrania języka tłumaczenia, nie ma też sensu aby
tłumaczył z niemieckiego na niemiecki").

## Goal

A note is translated into the language a reader asks for, not only the
reader's own; and a note is never "translated" into the language it was
written in. Both save calls to the AI and stop the odd sight of the same
German sentence twice.

## Design

- **Source language** = the UI language of the person who saved the note,
  stored on the entry as `srcLang` (every new entry carries it). No
  detection call: on a site the person writes in the language the app
  shows them. Old notes without `srcLang` count as unknown.
- **Automatic translation on save** targets the crew's languages plus
  German and the writer's own, minus `srcLang` (as before, minus the
  source).
- **The tap.** "Übersetzen" on a note opens a row of language chips: the
  crew's languages, German, English and the reader's language, minus
  the source and minus what is already translated. A tap translates into
  that language. If only one language is missing, the tap translates at
  once. "Alle übersetzen" keeps translating every note into the reader's
  language, skipping notes written in it.
- **Display.** Under the note, every translation present, each with its
  language code; the reader's own language first.

## Definition of done

- A note saved in Albanian (UI in Albanian) gets a German translation on
  save and no Albanian one; a note saved in German gets none for German.
- Tapping "Übersetzen" on a German note in a German UI offers other
  languages and never German.
- Render tests cover the source exclusion and the chip choice.

## Out of scope

- Language detection of the text itself.
- Translating entries other than notes.
