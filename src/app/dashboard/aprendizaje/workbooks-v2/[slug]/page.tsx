import { redirect } from 'next/navigation'

export const revalidate = 0

type SearchParams = Record<string, string | string[] | undefined>

export default async function WorkbookV2Page({
    params,
    searchParams
}: {
    params: Promise<{ slug: string }>
    searchParams: Promise<SearchParams>
}) {
    const { slug } = await params
    const resolvedSearchParams = await searchParams
    const query = new URLSearchParams()

    Object.entries(resolvedSearchParams).forEach(([key, value]) => {
        if (Array.isArray(value)) {
            value.forEach((item) => query.append(key, item))
            return
        }

        if (typeof value === 'string') {
            query.set(key, value)
        }
    })

    const suffix = query.toString() ? `?${query.toString()}` : ''
    redirect(`/dashboard/aprendizaje/workbooks/${slug}${suffix}`)
}
