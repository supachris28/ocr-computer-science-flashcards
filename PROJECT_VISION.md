# Project vision

## Vision

Create a web app that helps students revise OCR GCSE Computer Science (J277) through randomly selected flashcards. A student should be able to open the app, practise recall, and use their answers to identify what they should revisit.

## Intended experience

- The app presents a flashcard selected at random from the available revision cards.
- The student can attempt to recall the answer before revealing or checking it.
- The experience is focused on short, repeatable revision sessions.
- The content supports the OCR J277 specification and uses clear, accurate explanations appropriate for GCSE revision.

## Product direction

Build a focused revision tool around active recall and varied practice. Make the cards easy to use, the answers easy to check, and the experience simple to return to. Keep the first version centred on random flashcard practice; add broader study features only when they support this purpose.

## Initial scope

The initial product is a self-contained web application with a usable collection of OCR J277 revision flashcards and a way to practise them in random order. Package it as a Docker container for deployment on your server. The container should serve the web application on port 80 and work behind the existing reverse proxy, which handles incoming traffic.

## Guiding principles

1. **Specification-aligned:** organise and write revision content to reflect OCR J277.
2. **Recall first:** let students try to retrieve an answer before they see it.
3. **Varied practice:** use random card selection so each session can cover different material.
4. **Clear and focused:** keep the core practice flow straightforward and avoid adding features that distract from revision.
