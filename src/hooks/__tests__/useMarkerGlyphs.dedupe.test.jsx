import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';

jest.mock('../../supabaseClient', () => {
  // core select chain -> returns core ids
  const mockCoreOrder = jest.fn(() =>
    Promise.resolve({ data: [{ id: 1 }, { id: 2 }], error: null }),
  );
  const mockCoreEq = jest.fn(() => ({ order: mockCoreOrder }));
  const mockCoreLt = jest.fn(() => ({ eq: mockCoreEq }));
  const mockCoreSelect = jest.fn(() => ({ lt: mockCoreLt }));

  // appearance select chain -> returns glyphs
  const mockAppearanceEq = jest.fn(() =>
    Promise.resolve({
      data: [
        { id: 1, glyph: 'A' },
        { id: 2, glyph: 'B' },
      ],
      error: null,
    }),
  );
  const mockAppearanceLt = jest.fn(() => ({ eq: mockAppearanceEq }));
  const mockAppearanceSelect = jest.fn(() => ({ lt: mockAppearanceLt }));

  const mockFrom = jest.fn((table) => {
    if (table === 'markers_core') return { select: mockCoreSelect };
    if (table === 'markers_appearance') return { select: mockAppearanceSelect };
    return { select: jest.fn(() => Promise.resolve({ data: [], error: null })) };
  });

  const mockOn = jest.fn().mockReturnThis();
  const mockSubscribe = jest.fn(() => ({ id: 'ch-1' }));
  const mockChannel = jest.fn(() => ({ on: mockOn, subscribe: mockSubscribe }));
  const mockRemoveChannel = jest.fn();

  return {
    supabase: {
      from: mockFrom,
      channel: mockChannel,
      removeChannel: mockRemoveChannel,
    },
    __mocks__: {
      mockFrom,
      mockCoreSelect,
      mockCoreLt,
      mockCoreEq,
      mockCoreOrder,
      mockAppearanceSelect,
      mockAppearanceLt,
      mockAppearanceEq,
      mockChannel,
      mockSubscribe,
      mockRemoveChannel,
      mockOn,
    },
  };
});

import { useMarkerGlyphs } from '../useMarkerGlyphs';

function Probe({ year, id }) {
  const { markers, loading } = useMarkerGlyphs(year);
  return <div data-testid={`p-${id}`}>{loading ? 'loading' : JSON.stringify(markers)}</div>;
}

describe('useMarkerGlyphs cache/dedupe', () => {
  beforeEach(() => jest.clearAllMocks());

  it('dedupes REST calls and subscribes once per table/year', async () => {
    render(
      <div>
        <Probe id="a" year={2026} />
        <Probe id="b" year={2026} />
      </div>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('p-a').textContent).toMatch(/"glyph":"A"/);
      expect(screen.getByTestId('p-b').textContent).toMatch(/"glyph":"A"/);
    });

    const { supabase } = require('../../supabaseClient');

    // markers_core and markers_appearance should each be queried only once
    const calledTables = supabase.from.mock.calls.map((c) => c[0]);
    expect(calledTables).toContain('markers_core');
    expect(calledTables).toContain('markers_appearance');
    expect(supabase.from.mock.calls.filter((c) => c[0] === 'markers_core')).toHaveLength(1);
    expect(supabase.from.mock.calls.filter((c) => c[0] === 'markers_appearance')).toHaveLength(1);

    // realtime channels should be created once for each table
    expect(supabase.channel).toHaveBeenCalledTimes(2);
    expect(String(supabase.channel.mock.calls[0][0])).toMatch(/markers-core-glyphs/);
    expect(String(supabase.channel.mock.calls[1][0])).toMatch(/markers-appearance-glyphs/);
  });
});
