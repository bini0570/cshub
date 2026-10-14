import React, { useState } from 'react';
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  Sparkles,
  Flame,
  ArrowRight,
  RotateCcw,
  BookOpen,
} from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { CS_QUIZ_QUESTIONS } from '../../data/mockData';

export function QuickQuizWidget() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [totalAnswered, setTotalAnswered] = useState(0);

  const currentQ = CS_QUIZ_QUESTIONS[currentIndex] || CS_QUIZ_QUESTIONS[0];

  const handleSelectOption = (idx) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    setIsAnswered(true);
    setTotalAnswered((prev) => prev + 1);

    if (idx === currentQ.correctIndex) {
      setStreak((prev) => prev + 1);
      setScore((prev) => prev + 1);
    } else {
      setStreak(0);
    }
  };

  const handleNext = () => {
    setSelectedOption(null);
    setIsAnswered(false);
    setCurrentIndex((prev) => (prev + 1) % CS_QUIZ_QUESTIONS.length);
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setStreak(0);
    setScore(0);
    setTotalAnswered(0);
  };

  const isCorrect = selectedOption === currentQ.correctIndex;

  return (
    <section className="rounded-3xl bg-gradient-to-br from-navy-900 via-navy-950 to-navy-900 text-white border border-navy-800 p-6 sm:p-10 shadow-xl overflow-hidden relative">
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto space-y-6">
        {/* Header with Streaks */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-navy-800 pb-5">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 text-teal-300 text-xs font-bold border border-teal-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Interactive Daily CS Quick Quiz</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Test Your Computer Science Knowledge
            </h2>
          </div>

          {/* Gamified Score Badges */}
          <div className="flex items-center gap-3">
            {streak > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/40 animate-pulse">
                <Flame className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span>{streak} Streak!</span>
              </div>
            )}
            <div className="text-xs font-semibold text-slate-300 px-3 py-1.5 rounded-xl bg-navy-800/80 border border-navy-700">
              Score: <span className="text-teal-400 font-bold">{score}</span> / {totalAnswered}
            </div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-navy-950/70 border border-navy-800 rounded-2xl p-6 sm:p-8 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="teal" size="sm" className="font-bold">
                {currentQ.subject}
              </Badge>
              <Badge variant="navy" size="sm">
                {currentQ.year}
              </Badge>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Question {currentIndex + 1} of {CS_QUIZ_QUESTIONS.length}
            </span>
          </div>

          <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
            {currentQ.question}
          </h3>

          {/* Multiple Choice Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {currentQ.options.map((option, idx) => {
              const isSelected = selectedOption === idx;
              const isTargetCorrect = idx === currentQ.correctIndex;

              let btnStyle =
                'bg-navy-900/90 border-navy-700 hover:border-teal-500 text-slate-200 hover:bg-navy-800';

              if (isAnswered) {
                if (isTargetCorrect) {
                  btnStyle =
                    'bg-emerald-950/80 border-emerald-500 text-emerald-200 font-bold shadow-xs';
                } else if (isSelected && !isTargetCorrect) {
                  btnStyle =
                    'bg-rose-950/80 border-rose-500 text-rose-200 line-through';
                } else {
                  btnStyle = 'bg-navy-900/40 border-navy-800 text-slate-500 opacity-60';
                }
              }

              return (
                <button
                  key={idx}
                  type="button"
                  disabled={isAnswered}
                  onClick={() => handleSelectOption(idx)}
                  className={`p-4 rounded-xl border text-left text-xs sm:text-sm font-medium transition-all flex items-center justify-between gap-3 ${btnStyle}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-lg bg-navy-800 text-slate-300 font-mono font-bold text-xs flex items-center justify-center shrink-0">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span>{option}</span>
                  </div>

                  {isAnswered && (
                    <div>
                      {isTargetCorrect ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      ) : isSelected ? (
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                      ) : null}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation & Action Bar */}
          {isAnswered && (
            <div className="p-4 rounded-xl bg-navy-900/90 border border-navy-700 text-xs space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 font-bold text-sm">
                {isCorrect ? (
                  <span className="text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Correct Answer!
                  </span>
                ) : (
                  <span className="text-rose-400 flex items-center gap-1.5">
                    <XCircle className="w-4 h-4" /> Incorrect
                  </span>
                )}
              </div>
              <p className="text-slate-300 leading-relaxed font-normal">
                {currentQ.explanation}
              </p>
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={handleReset}
            className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Restart Quiz
          </button>

          <Button
            variant="primary"
            size="md"
            onClick={handleNext}
            icon={ArrowRight}
            className="shadow-md"
          >
            {isAnswered ? 'Next Question' : 'Skip Question'}
          </Button>
        </div>
      </div>
    </section>
  );
}
