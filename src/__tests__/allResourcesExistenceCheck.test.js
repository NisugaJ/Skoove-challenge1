const fs = require('fs');
const glob = require('fast-glob');
const path = require('path');
const yaml = require('js-yaml');

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
    let path = pathExpression

    // check if path starts with '/'
    if ((new RegExp(/^(\/)/mg)).test(path)) {
        // set base path as SHARED_FOLDER
        basePath = SHARED_FOLDER;
        // remove the '/' at start of the path
        path = path.replace(/^(\/)/mg, '')
    }

    // check if path starts with 'l/'
    if ((new RegExp(/^(l\/)/mg)).test(path)) {
        // removal of 'l/' at start of the path 
        path = path.replace(/^(l\/)/mg, '');

        // check for last occurence of '/'
        if ((new RegExp(/\/([^\/]*|)$/mg)).test(path)) {
            // replacing last '/' with '/en/'
            path = path.replace(/\/([^\/]*|)$/mg, `/${CURRENT_LOCALE}/$1`)
        } else {
            // appending 'en/' to path
            path = `${CURRENT_LOCALE}/` + path
        }

    }
    return basePath + '/' + FILE_RESOURCES_INFO[referenceKey] + '/' + path
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
    let lessonDirectories = getLessonDirectories()
    let unavailableResources = []

    // to simulate the testing process for larger number of lessonDirectories, change i to a larger number (eg.100)
    let largeCountOfLessonDirectories = []
    for (let i = 0; i < 1; i++) {
        largeCountOfLessonDirectories = largeCountOfLessonDirectories.concat(lessonDirectories)
    }
    const referenceKeys = Object.keys(FILE_RESOURCES_INFO)

    largeCountOfLessonDirectories.forEach((lessonDirectory) => {
        const tt = getActivityFile(lessonDirectory)
        const segments = Object.values(tt.segments)
        const segmentKeys = Object.keys(tt.segments)

        segments.forEach((segment, segmentIndex) => {
            referenceKeys.forEach(referenceKey => {
                    if (segment[referenceKey] && segment[referenceKey]['src'] && segment[referenceKey]['src'].length > 0) {
                        let pathExpression = segment[referenceKey]['src'];
                        const resourcePath = getFilePathToCheck(lessonDirectory, referenceKey, pathExpression);
                        // console.log(resourcePath);
                        const isAvailable = fs.existsSync(resourcePath)
                        test.concurrent(`${lessonDirectory} > ${segmentKeys[segmentIndex]} : ${referenceKey} resource (${pathExpression}) is available.`, async() => {
                            if (!isAvailable) {

                                unavailableResources.push({
                                    'LessonDirectory': lessonDirectory,
                                    'Segment': `segment${segmentIndex + 1}`,
                                    'ReferenceKey': referenceKey,
                                    'PathEexpression': pathExpression,
                                    'UnavailableResourcePath': resourcePath,
                                })
                            }
                            expect(isAvailable).toBeTruthy()
                        })
                    }
                }

            )
        })
    })


    afterAll(() => {
        /*** Generate report of Unavailable Resources into test-reports/unavailableResources_<epoch-timestamp>.json ***/
        if (unavailableResources.length > 0) {
            var beautify = require("json-beautify");
            var fs = require('fs');
            let beautified = beautify(unavailableResources, null, 2, 80)
            fs.writeFile(`./test-reports/unavailableResources_${Date.now()}.json`,
                beautified)
            console.log('Finished all');
        }
        /*********************************************************************************************************/
    });
})