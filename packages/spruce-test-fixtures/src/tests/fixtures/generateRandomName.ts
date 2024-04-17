import { uniqueNamesGenerator, starWars } from 'unique-names-generator'

export default function generateRandomName() {
    const randomName = uniqueNamesGenerator({
        dictionaries: [starWars],
    }).split(' ')

    const values = {
        firstName: randomName[0],
        lastName: randomName[1] ?? null,
    }
    return values
}
