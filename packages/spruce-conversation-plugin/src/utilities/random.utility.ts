import random from 'random'

const randomUtil = {
	rand(possibilities: any[]) {
		return possibilities[random.int(0, possibilities.length - 1)]
	},
}

export default randomUtil
