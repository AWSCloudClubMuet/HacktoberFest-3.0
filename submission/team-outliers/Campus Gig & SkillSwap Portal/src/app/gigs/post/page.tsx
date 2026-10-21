"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCurrentUser, createGig, initializeStore } from "@/lib/api";
import { GigCategory, GigType, PaymentType, User } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Avatar } from "@/components/ui/avatar";

export default function PostGigPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = React.useState<User | undefined>(undefined);

  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [type, setType] = React.useState<GigType>("Offering");
  const [category, setCategory] = React.useState<GigCategory>("Programming");
  const [paymentType, setPaymentType] = React.useState<PaymentType>("Paid");
  const [budget, setBudget] = React.useState<string>("35");
  const [deadline, setDeadline] = React.useState("");

  const [formError, setFormError] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  React.useEffect(() => {
    initializeStore();
    const u = getCurrentUser();
    setCurrentUser(u);

    // Set default deadline to 14 days from now
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 14);
    setDeadline(defaultDate.toISOString().split("T")[0]);

    const handleUserChange = () => setCurrentUser(getCurrentUser());
    window.addEventListener("user-changed", handleUserChange);
    return () => window.removeEventListener("user-changed", handleUserChange);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!currentUser) {
      setFormError("Please select a student user persona from the top bar before posting.");
      return;
    }

    if (title.trim().length < 5) {
      setFormError("Gig title must be at least 5 characters long.");
      return;
    }

    if (description.trim().length < 20) {
      setFormError("Please provide a more detailed description (minimum 20 characters) explaining the scope.");
      return;
    }

    if (paymentType === "Paid") {
      const budgetNum = Number(budget);
      if (isNaN(budgetNum) || budgetNum <= 0) {
        setFormError("Please enter a valid positive dollar budget for paid gigs.");
        return;
      }
    }

    if (!deadline) {
      setFormError("Please choose a valid deadline date.");
      return;
    }

    const deadlineDate = new Date(deadline);
    if (deadlineDate.getTime() <= Date.now()) {
      setFormError("Deadline must be a future date.");
      return;
    }

    try {
      setIsSubmitting(true);
      const newGig = createGig({
        user_id: currentUser.id,
        title: title.trim(),
        description: description.trim(),
        type,
        category,
        payment_type: paymentType,
        budget: paymentType === "Paid" ? Number(budget) : null,
        deadline: new Date(deadline).toISOString(),
      });

      router.push(`/gigs/${newGig.id}`);
    } catch (err: any) {
      setFormError(err.message || "Failed to create gig");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Breadcrumb */}
      <div>
        <Link
          href="/gigs"
          className="inline-flex items-center gap-1 text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors"
        >
          ← Back to Gigs Explorer
        </Link>
      </div>

      {/* Main Form Card */}
      <div className="rounded-3xl border border-stone-200/90 bg-white p-6 sm:p-10 shadow-xs space-y-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200/60">
            Validated Gig Creation
          </span>
          <h1 className="font-heading font-extrabold text-2xl sm:text-4xl text-stone-900 mt-2 tracking-tight">
            Post a New Campus Gig
          </h1>
          <p className="text-sm text-stone-500 mt-1">
            Publish an offering of your specialized skill or request short-term assistance for coursework
            and projects.
          </p>
        </div>

        {/* Current Active Persona Banner */}
        {currentUser && (
          <div className="flex items-center justify-between p-4 rounded-2xl bg-stone-50 border border-stone-200/80">
            <div className="flex items-center gap-3">
              <Avatar src={currentUser.avatarUrl} fallback={currentUser.name} size="md" />
              <div>
                <p className="text-xs text-stone-400 font-medium">Posting as:</p>
                <p className="text-sm font-bold text-stone-900 leading-tight">{currentUser.name}</p>
                <p className="text-xs text-stone-500">{currentUser.major}</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-amber-800 bg-amber-100/60 px-2.5 py-1 rounded-lg">
              Role: Flexible Poster
            </span>
          </div>
        )}

        {formError && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold flex items-center justify-between">
            <span>{formError}</span>
            <button onClick={() => setFormError("")} className="underline text-xs">
              Dismiss
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Gig Type Toggle: Offering vs Requesting */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wide text-stone-700 mb-2">
              Gig Intent <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType("Offering")}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  type === "Offering"
                    ? "border-amber-500 bg-amber-50/80 ring-2 ring-amber-300/40"
                    : "border-stone-200 bg-white hover:bg-stone-50"
                }`}
              >
                <p className="text-sm font-bold text-stone-900">Offering a Skill</p>
                <p className="text-xs text-stone-500 mt-0.5">
                  I want to provide my coding, design, writing, or tutoring services to others.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setType("Requesting")}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  type === "Requesting"
                    ? "border-amber-500 bg-amber-50/80 ring-2 ring-amber-300/40"
                    : "border-stone-200 bg-white hover:bg-stone-50"
                }`}
              >
                <p className="text-sm font-bold text-stone-900">Requesting Help</p>
                <p className="text-xs text-stone-500 mt-0.5">
                  I need a fellow student to build, design, review, or coach me on a project.
                </p>
              </button>
            </div>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="gigTitle" className="block text-xs font-bold uppercase tracking-wide text-stone-700 mb-1.5">
              Gig Title <span className="text-red-500">*</span>
            </label>
            <Input
              id="gigTitle"
              placeholder="e.g., Responsive Portfolio Website in Next.js & Tailwind"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="h-11"
            />
            <p className="text-[11px] text-stone-400 mt-1">
              Be descriptive so students can find your gig when searching keywords.
            </p>
          </div>

          {/* Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="gigCategory" className="block text-xs font-bold uppercase tracking-wide text-stone-700 mb-1.5">
                Category Domain <span className="text-red-500">*</span>
              </label>
              <Select
                id="gigCategory"
                value={category}
                onChange={(e) => setCategory(e.target.value as GigCategory)}
                className="h-11 font-medium"
              >
                <option value="Programming">💻 Programming & Web Dev</option>
                <option value="Design">🎨 Graphic & UI/UX Design</option>
                <option value="Writing">✍️ Writing & Proofreading</option>
                <option value="Tutoring">📚 Coursework & Exam Tutoring</option>
              </Select>
            </div>

            {/* Compensation / Payment Type */}
            <div>
              <label htmlFor="gigPayment" className="block text-xs font-bold uppercase tracking-wide text-stone-700 mb-1.5">
                Compensation Model <span className="text-red-500">*</span>
              </label>
              <Select
                id="gigPayment"
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value as PaymentType)}
                className="h-11 font-medium"
              >
                <option value="Paid">💰 Paid Gig (Monetary compensation)</option>
                <option value="SkillSwap">⇄ Skill Swap (Barter reciprocal skills)</option>
                <option value="Free">🎁 Free / Volunteer (Campus contribution)</option>
              </Select>
            </div>
          </div>

          {/* Conditional Budget Field */}
          {paymentType === "Paid" && (
            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-1">
              <label htmlFor="gigBudget" className="block text-xs font-bold uppercase tracking-wide text-amber-900">
                Budget in USD ($) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-stone-500 text-sm font-bold">
                  $
                </span>
                <Input
                  id="gigBudget"
                  type="number"
                  min="5"
                  step="5"
                  placeholder="e.g. 50"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="pl-7 h-11 bg-white font-semibold"
                  required
                />
              </div>
              <p className="text-[11px] text-amber-800">
                Set an honest, fair student rate for the requested or offered scope.
              </p>
            </div>
          )}

          {/* Deadline Date */}
          <div>
            <label htmlFor="gigDeadline" className="block text-xs font-bold uppercase tracking-wide text-stone-700 mb-1.5">
              Application / Completion Deadline <span className="text-red-500">*</span>
            </label>
            <Input
              id="gigDeadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="h-11 font-medium"
              required
            />
            <p className="text-[11px] text-stone-400 mt-1">
              Once this date passes, Open gigs automatically mark as Expired to keep the portal fresh.
            </p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="gigDesc" className="block text-xs font-bold uppercase tracking-wide text-stone-700 mb-1.5">
              Detailed Scope & Deliverables <span className="text-red-500">*</span>
            </label>
            <Textarea
              id="gigDesc"
              placeholder="Outline specific milestones, tech stack, deliverables, requirements, or what you hope to learn/trade..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              required
            />
          </div>

          {/* Submit Actions */}
          <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-3">
            <Link href="/gigs">
              <Button variant="outline" type="button">
                Cancel
              </Button>
            </Link>
            <Button type="submit" disabled={isSubmitting} className="font-bold px-8 shadow-sm">
              {isSubmitting ? "Publishing..." : "Publish Campus Gig →"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
