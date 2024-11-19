"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const Book_svc_1 = __importDefault(require("../../skillViewControllers/Book.svc"));
const Spy_svc_1 = __importDefault(require("../../skillViewControllers/Spy.svc"));
const BookForm_vc_1 = __importDefault(require("../../viewControllers/BookForm.vc"));
const App_ac_1 = __importDefault(require("../../App.ac"));

const vcs = {
    BookSkillViewController: Book_svc_1.default,
    BookFormViewController: BookForm_vc_1.default,
    SpyViewController: Spy_svc_1.default,
};
//@ts-ignore
if(typeof heartwood === 'function') { heartwood(vcs); }
exports.default = vcs;
exports.App = App_ac_1.default;
//# sourceMappingURL=views.js.map
