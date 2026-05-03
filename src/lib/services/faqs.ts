import { marked } from 'marked'
import faqContent from '@/content/FAQ-content.md?raw'

export type FaqItem = {
    category: string
    question: string
    answer: string
    answerHtml: string
}

export function getFaqs(): FaqItem[] {
    const lines = faqContent.split('\n')
    const faqs: FaqItem[] = []
    
    let currentCategory = ''
    let currentQuestion = ''
    let currentAnswer: string[] = []

    const pushCurrent = () => {
        if (currentQuestion && currentAnswer.length > 0) {
            const rawAnswer = currentAnswer.join('\n').trim()
            faqs.push({
                category: currentCategory || 'General',
                question: currentQuestion,
                answer: rawAnswer,
                answerHtml: marked.parse(rawAnswer, { async: false }) as string
            })
        }
    }

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        
        if (line.startsWith('# ')) {
            // New Category
            currentCategory = line.replace('# ', '').trim()
        } else if (line.startsWith('## ')) {
            // New Question
            pushCurrent()
            currentQuestion = line.replace('## ', '').trim()
            currentAnswer = []
        } else if (currentQuestion) {
            // Answer line
            currentAnswer.push(line)
        }
    }
    
    // Push the last item
    pushCurrent()

    return faqs
}

export function getCategories(): string[] {
    const faqs = getFaqs()
    const categories = new Set<string>()
    categories.add('All')
    faqs.forEach(faq => categories.add(faq.category))
    return Array.from(categories)
}
