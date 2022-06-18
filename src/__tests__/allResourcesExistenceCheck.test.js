const fs = require('fs');
const glob = require('fast-glob');
const path = require('path');
const yaml = require('js-yaml')

const LESSON_INDEX_FILE = 'index.yml';

const FILE_RESOURCES_INFO = {
    "flyer": "img",
    "expectation": "expect",
    "startVoiceOver": "voice",
    "flyer": "img",
    "listenAudioCue": "audio",
    "playAudioCue": "audio",
    "backingTrack": "audio",
    "handvideo": "video"
}

const CURRENT_LOCALE = "en"
const SHARED_FOLDER = "src/content/shared"
const SCHEMA_JSON = "src/schema/activity-schema.json"

function getLessonDirectories() {
    return glob.sync([`src/content/**/` + LESSON_INDEX_FILE])
        .map(
            path => path.split(`/${LESSON_INDEX_FILE}`)[0]
        )
}

function getFilePathToCheck(lessonDirectory, referenceKey, pathExpression) {
    let basePath = lessonDirectory
    if (pathExpression.trim()[0] === '/')
        basePath = SHARED_FOLDER

    if (pathExpression.trim().startsWith('l/') || pathExpression.trim().startsWith('/l/'))
        return basePath + '/' + FILE_RESOURCES_INFO[referenceKey] + `/${CURRENT_LOCALE}/` + pathExpression.trim('/').split('l/')[1]

    else
        return basePath + '/' + FILE_RESOURCES_INFO[referenceKey] + '/' + pathExpression
}


function getActivityFile(lessonDirectory) {
    try {
        const indexDoc = yaml.load(fs.readFileSync(lessonDirectory + '/' + LESSON_INDEX_FILE, 'utf8'))

        const activityDoc = yaml.load(fs.readFileSync(lessonDirectory + '/' + indexDoc[0].src + '.yml', 'utf8'))
        return activityDoc
    } catch (e) {
        console.log(e);
    }
}

describe('Test-Suite All Resources Existence Check', () => {
    const lessonDirectories = getLessonDirectories()
    const referenceKeys = Object.keys(FILE_RESOURCES_INFO)

    lessonDirectories.forEach((lessonDirectory) => {
        const tt = getActivityFile(lessonDirectory)
        const segments = Object.values(tt.segments)
        const segmentKeys = Object.keys(tt.segments)

        segments.forEach((segment, segmentindex) => {
            referenceKeys.forEach(referenceKey => {
                    if (segment[referenceKey] && segment[referenceKey]['src'] && segment[referenceKey]['src'].length > 0) {
                        let pathExpression = segment[referenceKey]['src'];
                        const resourcePath = getFilePathToCheck(lessonDirectory, referenceKey, pathExpression);
                        console.log(resourcePath);
                        const isAvailable = fs.existsSync(resourcePath)
                        test(`${lessonDirectory} > ${segmentKeys[segmentindex]}:             ${referenceKey} resource (${pathExpression}) is available.`, () => {
                            expect(isAvailable).toBeTruthy()
                        })
                    }
                }

            )
        })
    })
})