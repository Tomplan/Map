import React from 'react';
import { render, act } from '@testing-library/react';
import useEventSubscriptions from '../useEventSubscriptions';
import { supabase } from '../../supabaseClient';
// import the helper directly
import { _subscribeCompany_internal } from '../useEventSubscriptions';

jest.mock('../../supabaseClient', () => {
  const mSupabase = {
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: { email: 'test@test' } } }) },
    from: jest.fn(),
  };
  mSupabase.from.mockReturnValue({
    select: jest.fn(() => mSupabase.from()),
    eq: jest.fn(() => mSupabase.from()),
    upsert: jest.fn(() => mSupabase.from()),
    single: jest.fn(() => mSupabase.from()),
  });
  return { supabase: mSupabase };
});

describe('useEventSubscriptions subscribeCompany defaults', () => {
  let subscriptionChain;

  beforeEach(() => {
    jest.clearAllMocks();

    // prepare dedicated chain for event_subscriptions table so we can assert on it
    subscriptionChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      upsert: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: { id: 0 }, error: null }),
    };

    supabase.from.mockImplementation((table) => {
      if (table === 'event_subscriptions') return subscriptionChain;
      // generic dummy chain for other tables
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockReturnThis(),
      };
    });
  });

  it('uses provided booth_count of 0 instead of defaulting to 1', async () => {
    // prepare mock upsert result on the chain
    const chain = subscriptionChain; // alias for clarity
    chain.upsert.mockReturnValue(chain); // maintain fluent chain
    chain.single.mockResolvedValue({ data: { id: 123 }, error: null });

    await act(async () => {
      const resp = await _subscribeCompany_internal(new Date().getFullYear(), 7, { booth_count: 0 });
      expect(resp.error).toBeNull();
    });

    expect(supabase.from).toHaveBeenCalledWith('event_subscriptions');
    expect(chain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ booth_count: 0 }),
      expect.any(Object),
    );
  });

  it('defaults to 1 when booth_count omitted or non-number', async () => {
    const chain = subscriptionChain;
    chain.upsert.mockReturnValue(chain);
    chain.single.mockResolvedValue({ data: { id: 124 }, error: null });

    await act(async () => {
      await _subscribeCompany_internal(new Date().getFullYear(), 8, {});
    });
    expect(chain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ booth_count: 1 }),
      expect.any(Object),
    );

    subscriptionChain.single.mockResolvedValue({ data: { id: 125 }, error: null });
    await act(async () => {
      await _subscribeCompany_internal(new Date().getFullYear(), 9, { booth_count: 'foo' });
    });
    expect(chain.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ booth_count: 1 }),
      expect.any(Object),
    );
  });
});
