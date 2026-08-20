import { getWitnessBet } from "@/actions/witness";
import { CATEGORY_CONFIG } from "@/lib/types";
import { TrendingUp } from "lucide-react";
import WitnessVerdictButtons from "./WitnessVerdictButtons";

export default async function WitnessPage({ params }: { params: { token: string } }) {
  const bet = await getWitnessBet(params.token);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-zinc-950" />
          </div>
          <div>
            <div className="font-bold text-lg leading-tight">Bet On Yourself</div>
            <div className="text-xs text-zinc-500">You've been asked to witness a bet</div>
          </div>
        </div>

        {!bet ? (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 text-center">
            <div className="text-3xl mb-3">🔗</div>
            <div className="font-semibold mb-1">Link not found</div>
            <p className="text-sm text-zinc-500">
              This witness link is invalid, or it belongs to a bet that no longer exists.
            </p>
          </div>
        ) : (
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
            <div className="flex items-start gap-4 mb-5">
              <span
                className={`w-14 h-14 shrink-0 rounded-2xl border flex items-center justify-center text-3xl ${CATEGORY_CONFIG[bet.category].badge}`}
              >
                {bet.emoji}
              </span>
              <div>
                <h1 className="font-black text-lg leading-tight">{bet.title}</h1>
                {bet.description && (
                  <p className="text-sm text-zinc-400 mt-1">{bet.description}</p>
                )}
                <div className="text-sm text-amber-400 font-bold mt-1">
                  ${bet.stake.toLocaleString()} on the line
                </div>
              </div>
            </div>

            {bet.status !== "active" ? (
              <div className="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-400 text-center">
                This bet has already been settled — {bet.status === "won" ? "they won it." : "they lost it."}
              </div>
            ) : (
              <WitnessVerdictButtons
                token={params.token}
                title={bet.title}
                goalType={bet.goal_type}
                targetCheckins={bet.target_checkins}
                existingVerdict={bet.witness_verdict}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
