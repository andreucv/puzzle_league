/**
 * Batch loader for competition entries.
 * Instead of each CategoryCard fetching entries individually,
 * this fetches all entries for a competition in a single request
 * and distributes them to subscribers.
 */

type Subscriber = (entries: any[]) => void;

export class CompetitionEntriesBatch {
    private competitionId: number;
    private subscribers = new Map<number, Subscriber>();
    private fetchGeneration = 0;
    private refreshTimer: ReturnType<typeof setTimeout> | null = null;

    constructor(competitionId: number) {
        this.competitionId = competitionId;
    }

    subscribe(categoryId: number, callback: Subscriber) {
        this.subscribers.set(categoryId, callback);
    }

    unsubscribe(categoryId: number) {
        this.subscribers.delete(categoryId);
    }

    async fetchAll() {
        const generation = ++this.fetchGeneration;
        try {
            const res = await fetch(`/api/competitions/${this.competitionId}/entries`);
            if (generation !== this.fetchGeneration) return;
            if (res.ok) {
                const data = await res.json();
                if (generation !== this.fetchGeneration) return;
                const entries = data.entries as Record<string, any[]>;
                // Distribute to subscribers
                for (const [categoryId, callback] of this.subscribers) {
                    const categoryEntries = entries[String(categoryId)] ?? [];
                    callback(categoryEntries);
                }
            }
        } catch (err) {
            console.error('Failed to batch-fetch competition entries:', err);
        }
    }

    refreshAll() {
        if (this.refreshTimer) clearTimeout(this.refreshTimer);
        this.refreshTimer = setTimeout(() => {
            this.refreshTimer = null;
            this.fetchAll();
        }, 150);
    }

    destroy() {
        if (this.refreshTimer) clearTimeout(this.refreshTimer);
        this.subscribers.clear();
    }
}
