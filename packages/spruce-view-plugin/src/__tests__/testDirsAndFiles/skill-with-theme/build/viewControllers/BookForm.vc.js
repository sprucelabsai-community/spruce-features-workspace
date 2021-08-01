"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const heartwood_view_controllers_1 = require("@sprucelabs/heartwood-view-controllers");
const dotenv_1 = __importDefault(require("dotenv"));
class BookFormViewController extends heartwood_view_controllers_1.AbstractViewController {
    //@ts-ignore
    render() {
        //@ts-ignore
        console.log = dotenv_1.default;
        //@ts-ignore
        global.document = {
            //@ts-ignore
            __hack: true,
        };
        //@ts-ignore
        global.window = {
            //@ts-ignore
            __hack: true,
        };
        return {
            msg: 'what the?',
            //@ts-ignore
            globalHack2Value: global.__hack2,
        };
    }
}
exports.default = BookFormViewController;
BookFormViewController.id = 'book-form';
//# sourceMappingURL=BookForm.vc.js.map