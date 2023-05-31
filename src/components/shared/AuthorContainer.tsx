import React from 'react';
import AuthorQuickInfo from './AuthorQuickInfo';
import AuthorDetailsInfo from './AuthorDetailsInfo';
import { Author, Manga } from '~/types';

interface AuthorContainerProps {
    author: Author;
    comics: Manga[];
}

export default function AuthorContainer({
    author,
    comics,
}: AuthorContainerProps) {
    return (
        <div className="w-max-[1300px] z-[50] mx-auto flex h-fit min-h-screen flex-col md:flex-row md:space-x-4 lg:w-[90%]">
            <div className="h-fit md:h-full md:w-[30%] lg:w-[25%]">
                <AuthorQuickInfo author={author} />
            </div>
            <div className="mt-6 h-fit px-6 md:w-[70%] md:px-0 lg:w-[75%]">
                <AuthorDetailsInfo author={author} comics={comics} />
            </div>
        </div>
    );
}
