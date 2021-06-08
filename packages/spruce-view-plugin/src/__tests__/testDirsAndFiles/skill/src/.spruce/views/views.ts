import BookSkillViewController from '../../skillViewControllers/Book.svc'
import BookFormViewController from '../../viewControllers/BookForm.vc'

const vcs = {
    BookSkillViewController,
    BookFormViewController
}

//@ts-ignore
if (typeof heartwood === 'function') { heartwood(vcs) }

export default vcs