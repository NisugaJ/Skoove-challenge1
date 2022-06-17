# Quincy Content Consistency Check

This is one of Skoove's content development coding challenges.

Your task is to extend the automatic tests for checking the consistency of the content.

## The following rules apply:

* Supply clean and readable code.
* Supply build / make / run instructions if required
* Preferably, provide the code in a Git repository

## Installation

The npm installation and test running was tested with Node v14, NPM v6. Slightly higher versions should work, too.

Note that there is already a library provided to parse YML files.

## Sample test

The project already contains one sample test localizedResourceConsistency.test.js which should currently be green. It checks that all localized resources provided in the default language 'en' are also available in the other locales (in this case only 'de').

## Your challenge

Your test should make sure that all file resources referred to in the activity YML files exist. 

Activity YML files are files like `4516_long_short_notes.yml`. A YML file is an activity YML file to be checked if it is listed in an entry of type 'flyer' of any index.yml file in the project.

The directory structure reflects the hierarchy course/lesson/lesson-step, where the index.yml lists all activities of a lesson step.

The schema of activity YML files is provided under src/schema.

File resources are referenced by the following properties inside a segment:
* flyer.src (folder 'img')
* expectation.src (folder 'expect')
* startVoiceOver.src (folder 'voice')
* listenAudioCue.src, playAudioCue.src, backingTrack.src (folder 'audio')
* handvideo.src (folder 'video')

The values of these properties are special path expressions, to be resolved by the mobile engine. Since we want to do the consistency check on the CI system, the engine is not available.

Path expressions that start with a slash (`/`) are absolute paths referring to a shared folder. The characteristic folder name given in the bulleted list above is added automatically. For example, the path expression `"/my_expectation.csv"` will resolve to the file `src/content/shared/expect/my_expectation.csv` inside the project.

Path expressions that don't start with a slash are relative to the directory in which the YML file sits. The characteristic folder name is again added automatically. So `"my_expectation.csv"` in the step folder `src/content/beginner1/lesson1/4516_long_short_notes` will refer to `src/content/beginner1/lesson1/4516_long_short_notes/expect/my_expectation.csv`.

Path expressions that start with `/l/` (absolute) or `l/` (relative) refer to localized resources. This means that the locale is added as the last directory level before the file name. For example, `/l/rhythm/reminder_note_duration.aifc` used as a startVoiceOver refers to `src/content/shared/voice/rhythm/en/reminder_note_duration.aifc` when the current locale is English.

Your test should report any resource references in the activity YML files where the resources don't exist properly in the file system.

For localized resources, you only need to check the corresponding `en` folder, since the existing test already checks that the other locales are complete.

The data was designed manually such that there should be no consistency errors in the step 4516 (but human error is possible so don't take my word for it); in step 4519 there are many errors.