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
    // extracting lesson directory paths by identitying paths of index files in src/content directory
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


function getActivityFileObjects(lessonDirectory) {
    try {
        // read index file of the lessonDirectory
        const indexDoc = yaml.load(fs.readFileSync(lessonDirectory + '/' + LESSON_INDEX_FILE, 'utf8'))

        let activityDocObjects = []

        // from each json element in indexDoc
        indexDoc.forEach(indexElement => {
            // read the activity object content
            activityDocObjects.push(yaml.load(fs.readFileSync(lessonDirectory + '/' + indexElement.src + '.yml', 'utf8')))
        });
        return activityDocObjects
    } catch (e) {
        console.log(e);
    }
}

describe('Test-Suite All Resources Existence Check', () => {
    // read all the available lesson directories
    let lessonDirectories = getLessonDirectories()

    let unavailableResources = []
    const referenceKeys = Object.keys(FILE_RESOURCES_INFO)

    // to simulate the testing process for larger number of lessonDirectories, change i to a larger number (eg.100)
    let largeCountOfLessonDirectories = []
    for (let i = 0; i < 1; i++) {
        largeCountOfLessonDirectories = largeCountOfLessonDirectories.concat(lessonDirectories)
    }

    largeCountOfLessonDirectories.forEach((lessonDirectory) => {
        // extract content of each activityFileObject in the lesson directory using index.yml file
        const activityFileObjects = getActivityFileObjects(lessonDirectory)

        activityFileObjects.forEach(activityFileObject => {
            // extract segments and segmentKeys of the activityFileObject
            const segments = Object.values(activityFileObject.segments)
            const segmentKeys = Object.keys(activityFileObject.segments)

            segments.forEach((segment, segmentIndex) => {
                referenceKeys.forEach(referenceKey => {
                    // check if any src element exists in a referenceKey(E.g flyer, expectation,startVoiceOver,...)
                    if (segment[referenceKey] && segment[referenceKey]['src'] && segment[referenceKey]['src'].length > 0) {

                        // read the pathExpression from src (E.g. l/DDffDDff.svg )
                        let pathExpression = segment[referenceKey]['src'];

                        // build a resource path using lessonDirectory, referenceKey, pathExpression. (E.g. src/content/shared/voice/reminder_note_duration.aifc)
                        const resourcePath = getFilePathToCheck(lessonDirectory, referenceKey, pathExpression);

                        // check if any file exists for the resource path
                        const isAvailable = fs.existsSync(resourcePath)

                        test.concurrent(`${lessonDirectory} > ${segmentKeys[segmentIndex]} : ${referenceKey} resource (${pathExpression}) is available.`, async() => {

                            // append unavailableResource details to an array
                            if (!isAvailable) {
                                unavailableResources.push({
                                    'LessonDirectory': lessonDirectory,
                                    'Segment': `${segmentKeys[segmentIndex]}`,
                                    'ReferenceKey': referenceKey,
                                    'PathExpression': pathExpression,
                                    'UnavailableResourcePath': resourcePath,
                                })
                            }
                            expect(isAvailable).toBeTruthy()
                        })
                    }
                })
            })
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