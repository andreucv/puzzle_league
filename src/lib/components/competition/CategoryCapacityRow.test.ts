import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/svelte';

vi.mock('$lib/translations', async () => import('../../../tests/mocks/translations'));

import CategoryCapacityRow from './CategoryCapacityRow.svelte';

function makeCategory(overrides: Record<string, any> = {}) {
    return {
        type: 'INDIVIDUAL',
        subname: null as string | null,
        maxParties: 12 as number | null,
        _count: { entries: 3 },
        ...overrides
    };
}

function renderRow(categoryOverrides: Record<string, any> = {}, propsOverrides: Record<string, any> = {}) {
    return render(CategoryCapacityRow, {
        props: {
            category: makeCategory(categoryOverrides),
            competitionStatus: 'NOT_STARTED',
            registrationStatus: null,
            ...propsOverrides
        }
    });
}

describe('CategoryCapacityRow', () => {
    beforeEach(() => cleanup());

    describe('capacity bar (capped + NOT_STARTED)', () => {
        it('shows N/max and a success range when there is plenty of room', () => {
            const { container } = renderRow({ maxParties: 12, _count: { entries: 3 } });
            expect(screen.getByText('3/12')).toBeInTheDocument();
            expect(container.querySelector('.bg-success-500')).not.toBeNull();
        });

        it('shows a warning range when 3 or fewer spots remain', () => {
            const { container } = renderRow({ maxParties: 12, _count: { entries: 10 } });
            expect(screen.getByText('10/12')).toBeInTheDocument();
            expect(container.querySelector('.bg-warning-500')).not.toBeNull();
        });

        it('shows an error range when full', () => {
            const { container } = renderRow({ maxParties: 12, _count: { entries: 12 } });
            expect(screen.getByText('12/12')).toBeInTheDocument();
            expect(container.querySelector('.bg-error-500')).not.toBeNull();
        });

        it('clamps the label to max when overbooked (no overbooked shown)', () => {
            const { container } = renderRow({ maxParties: 12, _count: { entries: 15 } });
            expect(screen.getByText('12/12')).toBeInTheDocument();
            expect(screen.queryByText('15/12')).toBeNull();
            expect(container.querySelector('.bg-error-500')).not.toBeNull();
        });
    });

    describe('plain count fallback', () => {
        it('shows the registered count (no bar) when uncapped', () => {
            const { container } = renderRow({ maxParties: null, _count: { entries: 3 } });
            expect(screen.queryByText('3/12')).toBeNull();
            expect(screen.getByText('competition_card.registered_count')).toBeInTheDocument();
            expect(container.querySelector('.bg-success-500, .bg-warning-500, .bg-error-500')).toBeNull();
        });

        it('shows the plain count (no bar) when the competition is not upcoming', () => {
            renderRow({ maxParties: 12, _count: { entries: 3 } }, { competitionStatus: 'STARTED' });
            expect(screen.queryByText('3/12')).toBeNull();
            expect(screen.getByText('competition_card.registered_count')).toBeInTheDocument();
        });
    });

    describe('registration indicator', () => {
        it('renders a confirmed indicator with the confirmed status label', () => {
            const { container } = renderRow({}, { registrationStatus: 'CONFIRMED' });
            expect(container.querySelector('[title="registration.status_confirmed"]')).not.toBeNull();
        });

        it('renders a pending indicator with the pending status label', () => {
            const { container } = renderRow({}, { registrationStatus: 'PENDING_CONFIRMATION' });
            expect(container.querySelector('[title="registration.status_pending_confirmation"]')).not.toBeNull();
        });

        it('renders no registration indicator when the user is not registered', () => {
            const { container } = renderRow({}, { registrationStatus: null });
            expect(container.querySelector('[title^="registration.status"]')).toBeNull();
        });
    });

    describe('subname', () => {
        it('shows the subname when present', () => {
            renderRow({ subname: '500 pcs' });
            expect(screen.getByText('500 pcs')).toBeInTheDocument();
        });

        it('hides the subname when it equals the uppercased type name', () => {
            renderRow({ subname: 'CATEGORY_NAMES.INDIVIDUAL' });
            expect(screen.queryByText('CATEGORY_NAMES.INDIVIDUAL')).toBeNull();
        });
    });
});
