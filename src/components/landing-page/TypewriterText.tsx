'use client';

import { useState, useEffect } from 'react';

interface TypewriterTextProps {
	words: string[];
	typingSpeed?: number;
	deletingSpeed?: number;
	delayBetweenWords?: number;
}

export default function TypewriterText({ words, typingSpeed = 100, deletingSpeed = 50, delayBetweenWords = 1500 }: TypewriterTextProps) {
	const [currentWordIndex, setCurrentWordIndex] = useState(0);
	const [currentText, setCurrentText] = useState('');
	const [isDeleting, setIsDeleting] = useState(false);

	useEffect(() => {
		const timeout = setTimeout(
			() => {
				// Current word being typed/deleted
				const currentWord = words[currentWordIndex];

				// If deleting, remove a character, otherwise add a character
				if (isDeleting) {
					setCurrentText(currentWord.substring(0, currentText.length - 1));
				} else {
					setCurrentText(currentWord.substring(0, currentText.length + 1));
				}

				// If we've completed typing the word and not deleting yet, start deleting after delay
				if (!isDeleting && currentText === currentWord) {
					setTimeout(() => {
						setIsDeleting(true);
					}, delayBetweenWords);
				}
				// If we've deleted the word completely, move to next word
				else if (isDeleting && currentText === '') {
					setIsDeleting(false);
					setCurrentWordIndex((prevIndex) => (prevIndex + 1) % words.length);
				}
			},
			isDeleting ? deletingSpeed : typingSpeed
		);

		return () => clearTimeout(timeout);
	}, [currentText, currentWordIndex, isDeleting, words, typingSpeed, deletingSpeed, delayBetweenWords]);

	return <span className='text-black'>{currentText}</span>;
}
