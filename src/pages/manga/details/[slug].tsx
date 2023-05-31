import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { GetStaticPaths, GetStaticProps, NextPage } from 'next';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { ParsedUrlQuery } from 'querystring';
import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import useSWR from 'swr';
import { useIntersectionObserver, useMediaQuery } from 'usehooks-ts';
import { followModal } from '~/atoms/followModaAtom';
import { mangaSources } from '~/atoms/mangaSourcesAtom';
import { mangaSrc } from '~/atoms/mangaSrcAtom';
import CommentContainer from '~/components/features/comment/CommentContainer';
import Vote from '~/components/features/Vote';
import MainLayout from '~/components/layouts/MainLayout';
import ClientOnly from '~/components/shared/ClientOnly';
import DetailsBanner from '~/components/shared/DetailsBanner';
import DetailsChapterList from '~/components/shared/DetailsChapterList';
import DetailsDescription from '~/components/shared/DetailsDescription';
import DetailsInfo from '~/components/shared/DetailsInfo';
import Head from '~/components/shared/Head';
import Section from '~/components/shared/Section';
import { REVALIDATE_TIME } from '~/constants';
import { CommentContextProvider } from '~/context/CommentContext';
import ComicModel from '~/serverless/models/Comic.model';
import { axiosClientV2 } from '~/services/axiosClient';
import axios from 'axios';
import {
    Chapter,
    ChapterDetails,
    Comic,
    SourcesId,
    ViewSelection,
} from '~/types';

const FollowModal = dynamic(
    () =>
        import('~/components/features/FollowModal', {
            ssr: false,
        } as ImportCallOptions),
);

const TabSelect = dynamic(
    () =>
        import('~/components/features/TabSelect', {
            ssr: false,
        } as ImportCallOptions),
);

const DetailedCategory = dynamic(
    () =>
        import('~/components/shared/DetailedCategory', {
            ssr: false,
        } as ImportCallOptions),
);

interface Params extends ParsedUrlQuery {
    slug: string;
}

interface DetailsPageProps {
    // manga: MangaDetails;
    comic: Comic;
}

const DetailsPage: NextPage<DetailsPageProps> = ({ comic }) => {
    const router = useRouter();

    //UI States
    const followModalState = useAtomValue(followModal);
    const [viewSelection, setViewSelection] =
        useState<ViewSelection>('Chapters');
    const matchesMobile = useMediaQuery('(max-width: 768px)');
    const refCommentSection = useRef<HTMLDivElement | null>(null);
    const entry = useIntersectionObserver(refCommentSection, {});

    const [shouldShowComments, setShouldShowComments] = useState(false);
    if (router.query?.scrollTo && !shouldShowComments) {
        setShouldShowComments(true);
    }
    useEffect(() => {
        if (!!entry?.isIntersecting && !shouldShowComments) {
            setShouldShowComments(true);
        }
    }, [!!entry?.isIntersecting]);

    //Data States
    const [src, _] = useAtom(mangaSrc);
    const setSourceAvailable = useSetAtom(mangaSources);
    const [chapters, setChapters] = useState<Chapter[]>(
        comic?.chapters?.chapters_list[0].chapters || [],
    );
    const [chaptersInfo, setChaptersInfo] = useState<
        ChapterDetails | undefined
    >(comic?.chapters);

    const { data: ChaptersReValidate } = useSWR<{
        message: string;
        chapters?: ChapterDetails;
    }>(comic?.slug, async (slug) => {
        const res = await (
            await axiosClientV2.get(`/comics/${slug}/chapters`, {
                params: {
                    options: 'get',
                },
            })
        ).data;

        return res;
    });

    //call caching layer
    useEffect(() => {
        (async function () {
            try {
                if (comic?.slug) {
                    await axios.get('/api/pages-caching', {
                        params: {
                            comicSlug: comic?.slug,
                        },
                    });
                }
            } catch (error) {}
        })();
    }, [comic?.slug]);

    useEffect(() => {
        if (chaptersInfo && chaptersInfo?.chapters_list.length) {
            const chaptersBySource = chaptersInfo.chapters_list.find((list) => {
                return list.sourceName === src;
            });

            if (
                chaptersBySource?.chapters &&
                chaptersBySource?.chapters.length
            ) {
                setChapters(chaptersBySource.chapters);
            } else if (
                chaptersInfo?.chapters_list[0] &&
                chaptersInfo.chapters_list[0].chapters.length
            ) {
                setChapters(chaptersInfo.chapters_list[0].chapters);
            }
        }
    }, [src, chaptersInfo]);

    useEffect(() => {
        if (ChaptersReValidate?.chapters) {
            setChaptersInfo(ChaptersReValidate?.chapters);
        }

        if (comic?.chapters) {
            // setChaptersInfo(comic?.chapters);

            comic.chapters.chapters_list.map((chapObj) => {
                setSourceAvailable((prevState) => {
                    const sources = [...prevState];

                    if (
                        !prevState.find(
                            (e) => e.sourceId === chapObj.sourceName,
                        )
                    ) {
                        sources.push({
                            sourceId: chapObj.sourceName as SourcesId,
                            sourceName: chapObj.sourceName,
                        });
                    }

                    return sources;
                });
            });
        }

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ChaptersReValidate, comic?.chapters, router]);

    const notify = (message: string, status: string) => {
        if (status === 'success')
            toast.success(message, { duration: 3000, style: { zIndex: 899 } });
        else
            toast.error(message, {
                duration: 3000,
                style: { zIndex: 899 },
            });
    };

    const handleSelectView = useCallback((value: string) => {
        setViewSelection(value as ViewSelection);
    }, []);

    return (
        <>
            <Head
                title={`${comic ? comic?.name + ' - ' : ''}  Kyoto Manga`}
                description={`${comic?.review}`}
                image={`${comic?.thumbnail}`}
            />
            <ClientOnly>
                <div className="flex h-fit flex-col overflow-y-hidden">
                    <DetailsBanner
                        isLoading={router.isFallback}
                        imgUrl={comic?.thumbnail || 'notFound'}
                    />

                    <div className="z-10 mx-auto min-h-screen w-[85%] pt-32">
                        <Section style="h-fit w-full">
                            <DetailsInfo
                                isLoading={router.isFallback}
                                manga={comic}
                                chapters={chaptersInfo}
                            />
                        </Section>

                        <Section style="h-fit w-full">
                            <DetailsDescription
                                isLoading={router.isFallback}
                                mangaReview={comic?.review || ''}
                                mobileUI={matchesMobile}
                            />
                        </Section>

                        <Section title="Bình chọn" style="h-fit w-full">
                            <Vote
                                comicName={comic?.name || ''}
                                comicSlug={comic?.slug || ''}
                            />
                        </Section>

                        {comic?.description && (
                            <>
                                <Section>
                                    <TabSelect
                                        selectAction={handleSelectView}
                                        selections={[
                                            'Chapters',
                                            'Characters',
                                            'Details',
                                            'Pictures',
                                        ]}
                                    />
                                </Section>

                                <DetailedCategory
                                    description={comic.description}
                                    viewSelection={
                                        viewSelection as ViewSelection
                                    }
                                />
                            </>
                        )}

                        <Section
                            title="Danh sách chương"
                            style={`h-fit w-full ${
                                viewSelection !== 'Chapters' && 'hidden'
                            }`}
                        >
                            <DetailsChapterList
                                containerStyle="my-6 flex h-fit w-full flex-col overflow-x-hidden rounded-xl bg-highlight"
                                maxWTitleMobile={200}
                                selectSource
                                mobileHeight={600}
                                chapterList={chapters}
                                chapterInfo={chaptersInfo}
                                mobileUI={matchesMobile}
                            />
                        </Section>

                        {followModalState && (
                            <FollowModal
                                callbackMessage={notify}
                                manga={comic}
                            />
                        )}

                        <section ref={refCommentSection}></section>

                        <Section
                            title="Bình luận"
                            style={`py-4 my-4 h-fit w-full text-white`}
                        >
                            <CommentContextProvider
                                shouldFetch={shouldShowComments}
                                comic={{
                                    comicName: comic?.name,
                                    comicSlug: comic?.slug,
                                }}
                            >
                                <CommentContainer />
                            </CommentContextProvider>
                        </Section>

                        <Toaster position="bottom-center" />
                    </div>
                </div>
            </ClientOnly>
        </>
    );
};

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-ignore
export const getStaticProps: GetStaticProps<DetailsPageProps, Params> = async (
    ctx,
) => {
    try {
        const { slug } = ctx.params as Params;

        const result = await ComicModel.findOne({ slug })
            .populate('chapters')
            .populate('description');

        if (result) {
            return {
                props: {
                    comic: JSON.parse(JSON.stringify(result)),
                },
                revalidate: REVALIDATE_TIME,
            };
        } else {
            //error 2 slug 1 comic (nt source)
            const result = await ComicModel.findOne({ slug: slug + '0' })
                .populate('chapters')
                .populate('description');

            if (result) {
                return {
                    props: {
                        comic: JSON.parse(JSON.stringify(result)),
                    },
                    revalidate: REVALIDATE_TIME,
                };
            }

            try {
                const resultFallback = await (
                    await axiosClientV2.get(`/comics/${slug}/info`)
                ).data;

                if (!resultFallback) return { notFound: true };

                const { comic } = resultFallback;

                return {
                    props: {
                        comic: JSON.parse(JSON.stringify(comic)),
                    },
                    revalidate: REVALIDATE_TIME,
                };
            } catch (err) {
                return { notFound: true };
            }
        }
    } catch (err) {
        return { notFound: true };
    }
};

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
export const getStaticPaths: GetStaticPaths<Params> = async () => {
    return { paths: [], fallback: true };
};

// const DetailsPageWidthDbScrollTT = withDbScroll<DetailsPageProps>(DetailsPage);

export default DetailsPage;

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
DetailsPage.getLayout = (page: ReactNode) => {
    return (
        <MainLayout
            showHeader
            showFooter
            customStyleHeader={
                'w-full max-w-[1400px] h-40 absolute top-[-10px] z-50 left-1/2 -translate-x-1/2 bg-transparent'
            }
        >
            {page}
        </MainLayout>
    );
};
