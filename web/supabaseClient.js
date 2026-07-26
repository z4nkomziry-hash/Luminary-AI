/**
 * Luminary AI - Supabase Client Configuration
 * Database connection, authentication, and API helpers
 * Developer: Zaniyar Al-Mzurii
 * Version: 6.0.0
 */

'use strict';

// ============================================================
// SUPABASE CONFIGURATION
// ============================================================

var SUPABASE_URL = 'https://csjtpzptvqoomotqbeuh.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNzanRwenB0dnFvb21vdHFiZXVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUwOTE4NzYsImV4cCI6MjEwMDY2Nzg3Nn0.INC3yPbzbFOLP7ocSgtx33V-zHJG9AVvFRX0qjB2ZvE';

// Allow overriding via global config
if (window.APP && window.APP.config) {
    if (window.APP.config.supabaseUrl) SUPABASE_URL = window.APP.config.supabaseUrl;
    if (window.APP.config.supabaseAnonKey) SUPABASE_ANON_KEY = window.APP.config.supabaseAnonKey;
}

// ============================================================
// SUPABASE CLIENT INITIALIZATION
// ============================================================

var supabase = null;
var isSupabaseReady = false;
var supabaseInitError = null;

(function initSupabase() {
    // Check if Supabase SDK is loaded via CDN
    if (typeof window.supabase !== 'undefined' && typeof window.supabase.createClient === 'function') {
        try {
            supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: true,
                    storageKey: 'luminary-auth-token',
                    flowType: 'pkce'
                },
                db: {
                    schema: 'public'
                },
                global: {
                    headers: {
                        'x-application-name': 'luminary-ai',
                        'x-client-version': '6.0.0'
                    }
                },
                realtime: {
                    params: {
                        eventsPerSecond: 10
                    }
                }
            });

            isSupabaseReady = true;
            console.log('✅ Supabase client initialized successfully');
            console.log('🔗 URL:', SUPABASE_URL);
            console.log('📦 Schema: public');
        } catch (err) {
            console.error('❌ Supabase initialization error:', err.message);
            supabaseInitError = err.message;
            supabase = createMockSupabaseClient();
        }
    } else {
        console.warn('⚠️ Supabase SDK not loaded. Running in demo/offline mode.');
        console.info('💡 Add the Supabase CDN script to enable full functionality:');
        console.info('   <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.min.js"></script>');
        supabase = createMockSupabaseClient();
    }
})();

// ============================================================
// MOCK SUPABASE CLIENT (Demo/Offline Mode)
// ============================================================

function createMockSupabaseClient() {
    console.log('📝 Creating mock Supabase client for demo mode');

    // In-memory mock database
    var mockDatabase = {
        profiles: [
            {
                id: 'p1',
                user_id: 'u1',
                custom_id: '4829105736-ABCDE',
                username: 'demo_user',
                email: 'demo@luminary.ai',
                full_name: 'Demo User',
                avatar_url: null,
                bio: 'This is a demo account for testing purposes.',
                subscription_status: 'free',
                daily_generations_count: 3,
                total_generations_count: 47,
                points_balance: 250,
                coins_balance: 150,
                gems_balance: 25,
                hearts_balance: 5,
                level: 2,
                xp_points: 1250,
                streak_days: 3,
                total_words_learned: 45,
                badges: ['{"name":"Early Adopter","icon":"🚀"}'],
                is_verified: false,
                is_vip: false,
                is_banned: false,
                preferred_language: 'EN',
                preferred_dialect: 'sorani',
                created_at: '2025-01-15T10:30:00Z',
                updated_at: '2025-06-15T14:22:00Z'
            },
            {
                id: 'p2',
                user_id: 'u2',
                custom_id: '7391052846-FGHIJ',
                username: 'pro_user',
                email: 'pro@luminary.ai',
                full_name: 'Pro User',
                avatar_url: null,
                bio: 'Professional content creator and language enthusiast.',
                subscription_status: 'pro',
                daily_generations_count: 128,
                total_generations_count: 2847,
                points_balance: 5000,
                coins_balance: 3200,
                gems_balance: 180,
                hearts_balance: 5,
                level: 8,
                xp_points: 8750,
                streak_days: 21,
                total_words_learned: 340,
                badges: ['{"name":"Pro Creator","icon":"💎"}', '{"name":"Verified","icon":"✅"}'],
                is_verified: true,
                is_vip: true,
                is_banned: false,
                preferred_language: 'EN',
                preferred_dialect: 'badini',
                created_at: '2025-01-10T08:15:00Z',
                updated_at: '2025-06-20T09:45:00Z'
            },
            {
                id: 'p3',
                user_id: 'u3',
                custom_id: '1568930472-KLMNO',
                username: 'kurdish_learner',
                email: 'learner@luminary.ai',
                full_name: 'Sara Ahmed',
                avatar_url: null,
                bio: 'Learning Kurdish and loving it!',
                subscription_status: 'free',
                daily_generations_count: 5,
                total_generations_count: 120,
                points_balance: 450,
                coins_balance: 280,
                gems_balance: 60,
                hearts_balance: 4,
                level: 3,
                xp_points: 2750,
                streak_days: 7,
                total_words_learned: 89,
                badges: ['{"name":"Streak Champion","icon":"🔥"}'],
                is_verified: false,
                is_vip: false,
                is_banned: false,
                preferred_language: 'KU-SO',
                preferred_dialect: 'sorani',
                created_at: '2025-02-20T12:00:00Z',
                updated_at: '2025-06-18T16:30:00Z'
            }
        ],
        payment_requests: [
            {
                id: 'pay1',
                user_id: 'u2',
                method: 'FIB',
                transaction_id: 'TX987654321',
                receipt_url: null,
                amount: 9.99,
                currency: 'USD',
                full_name: 'Pro User',
                email: 'pro@luminary.ai',
                plan_type: 'pro',
                status: 'pending',
                created_at: '2025-06-19T11:00:00Z'
            },
            {
                id: 'pay2',
                user_id: 'u3',
                method: 'FastPay',
                transaction_id: 'TX123456789',
                receipt_url: null,
                amount: 9.99,
                currency: 'USD',
                full_name: 'Sara Ahmed',
                email: 'learner@luminary.ai',
                plan_type: 'pro',
                status: 'pending',
                created_at: '2025-06-20T09:30:00Z'
            }
        ],
        generations: [
            {
                id: 'g1',
                user_id: 'u1',
                prompt: 'Hello world',
                response: 'سڵاو جیهان! This is a demo response.',
                language: 'EN',
                task: 'translate',
                model: 'gemini-1.5-flash',
                created_at: '2025-06-15T10:00:00Z'
            },
            {
                id: 'g2',
                user_id: 'u1',
                prompt: 'Tell me about Kurdish language',
                response: 'Kurdish is an Indo-European language spoken by Kurds in the region of Kurdistan...',
                language: 'EN',
                task: 'generate',
                model: 'gemini-1.5-flash',
                created_at: '2025-06-15T11:00:00Z'
            },
            {
                id: 'g3',
                user_id: 'u2',
                prompt: 'Translate to Kurdish Sorani: Welcome to Luminary AI',
                response: 'بەخێربێیت بۆ لومیناری ئەی‌آی',
                language: 'KU-SO',
                task: 'translate',
                model: 'gemini-1.5-flash',
                created_at: '2025-06-20T08:00:00Z'
            }
        ],
        user_sessions: [
            {
                id: 's1',
                user_id: 'u1',
                device_info: { browser: 'Chrome', os: 'Windows' },
                ip_address: '192.168.1.1',
                is_active: true,
                last_active_at: '2025-06-20T15:00:00Z',
                created_at: '2025-06-15T10:00:00Z'
            }
        ],
        connections: [],
        messages: [],
        wallet_transactions: [
            {
                id: 'wt1',
                user_id: 'u1',
                transaction_type: 'daily_reward',
                currency_type: 'coins',
                amount: 10,
                balance_after: 150,
                description: 'Daily login reward',
                created_at: '2025-06-20T00:00:00Z'
            }
        ],
        user_progress: [
            {
                id: 'up1',
                user_id: 'u1',
                language_pair: 'en-ku',
                words_learned: 45,
                lessons_completed: 5,
                quizzes_taken: 12,
                quizzes_passed: 9,
                total_xp_earned: 450,
                current_streak: 3,
                longest_streak: 5,
                created_at: '2025-01-15T10:30:00Z'
            }
        ],
        vocabulary: [
            { id: 'v1', language_pair: 'en-ku', category: 'greetings', word_source: 'Hello', word_target: 'سڵاو', word_badini: 'سلاڤ', difficulty_level: 1 },
            { id: 'v2', language_pair: 'en-ku', category: 'greetings', word_source: 'Goodbye', word_target: 'خواحافیزی', word_badini: 'خاترێ تە', difficulty_level: 1 },
            { id: 'v3', language_pair: 'en-ku', category: 'greetings', word_source: 'Thank you', word_target: 'سوپاس', word_badini: 'سپاس', difficulty_level: 1 },
            { id: 'v4', language_pair: 'en-ku', category: 'numbers', word_source: 'One', word_target: 'یەک', word_badini: 'ئیەک', difficulty_level: 1 },
            { id: 'v5', language_pair: 'en-ku', category: 'numbers', word_source: 'Two', word_target: 'دوو', word_badini: 'دو', difficulty_level: 1 }
        ]
    };

    // Helper to generate unique IDs
    function generateId() {
        return 'mock_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Helper to clone data (prevent mutation)
    function cloneData(data) {
        return JSON.parse(JSON.stringify(data));
    }

    // Build the mock client
    return {
        auth: {
            getUser: function() {
                return Promise.resolve({
                    data: { user: null },
                    error: null
                });
            },
            getSession: function() {
                return Promise.resolve({
                    data: { session: null },
                    error: null
                });
            },
            signUp: function(credentials) {
                var newUser = {
                    id: generateId(),
                    email: credentials.email,
                    user_metadata: { full_name: credentials.options?.data?.full_name || '' },
                    created_at: new Date().toISOString()
                };
                console.log('📝 Mock signUp:', credentials.email);
                return Promise.resolve({
                    data: { user: newUser, session: null },
                    error: null
                });
            },
            signInWithPassword: function(credentials) {
                var user = mockDatabase.profiles.find(function(p) {
                    return p.email === credentials.email;
                });
                if (user) {
                    console.log('✅ Mock signIn:', credentials.email);
                    return Promise.resolve({
                        data: { user: { id: user.user_id, email: user.email }, session: { access_token: 'mock_token_' + Date.now() } },
                        error: null
                    });
                }
                return Promise.resolve({
                    data: { user: null, session: null },
                    error: { message: 'Invalid login credentials' }
                });
            },
            signInWithOAuth: function(options) {
                console.log('🔗 Mock OAuth signIn:', options.provider);
                return Promise.resolve({
                    data: { provider: options.provider, url: options.options?.redirectTo || '/' },
                    error: null
                });
            },
            signOut: function() {
                console.log('👋 Mock signOut');
                return Promise.resolve({ error: null });
            },
            onAuthStateChange: function(callback) {
                console.log('👂 Mock auth state listener registered');
                return {
                    data: {
                        subscription: {
                            unsubscribe: function() {
                                console.log('🔌 Mock auth listener unsubscribed');
                            }
                        }
                    }
                };
            },
            resetPasswordForEmail: function(email) {
                console.log('🔑 Mock password reset for:', email);
                return Promise.resolve({ data: {}, error: null });
            },
            updateUser: function(attributes) {
                console.log('✏️ Mock updateUser:', Object.keys(attributes));
                return Promise.resolve({ data: { user: {} }, error: null });
            }
        },

        from: function(tableName) {
            var table = mockDatabase[tableName] || [];

            return {
                select: function(columns) {
                    var selectedData = cloneData(table);
                    var queryBuilder = {
                        _data: selectedData,
                        _filters: [],
                        _orderBy: null,
                        _orderAsc: true,
                        _limit: null,
                        _offset: null,
                        _single: false,
                        _count: null,

                        eq: function(field, value) {
                            this._filters.push({ field: field, operator: 'eq', value: value });
                            return this;
                        },

                        neq: function(field, value) {
                            this._filters.push({ field: field, operator: 'neq', value: value });
                            return this;
                        },

                        gt: function(field, value) {
                            this._filters.push({ field: field, operator: 'gt', value: value });
                            return this;
                        },

                        gte: function(field, value) {
                            this._filters.push({ field: field, operator: 'gte', value: value });
                            return this;
                        },

                        lt: function(field, value) {
                            this._filters.push({ field: field, operator: 'lt', value: value });
                            return this;
                        },

                        lte: function(field, value) {
                            this._filters.push({ field: field, operator: 'lte', value: value });
                            return this;
                        },

                        like: function(field, pattern) {
                            this._filters.push({ field: field, operator: 'like', value: pattern });
                            return this;
                        },

                        ilike: function(field, pattern) {
                            this._filters.push({ field: field, operator: 'ilike', value: pattern });
                            return this;
                        },

                        or: function(filterString) {
                            this._filters.push({ operator: 'or', value: filterString });
                            return this;
                        },

                        order: function(column, options) {
                            this._orderBy = column;
                            this._orderAsc = !options || !options.ascending ? true : options.ascending;
                            return this;
                        },

                        limit: function(n) {
                            this._limit = n;
                            return this;
                        },

                        range: function(start, end) {
                            this._offset = start;
                            this._limit = end - start + 1;
                            return this;
                        },

                        single: function() {
                            this._single = true;
                            return this;
                        },

                        maybeSingle: function() {
                            this._single = true;
                            return this;
                        },

                        then: function(resolve, reject) {
                            try {
                                var result = queryBuilder._applyFilters();
                                var count = result.length;

                                if (queryBuilder._orderBy) {
                                    result.sort(function(a, b) {
                                        var aVal = a[queryBuilder._orderBy];
                                        var bVal = b[queryBuilder._orderBy];
                                        if (aVal < bVal) return queryBuilder._orderAsc ? -1 : 1;
                                        if (aVal > bVal) return queryBuilder._orderAsc ? 1 : -1;
                                        return 0;
                                    });
                                }

                                if (queryBuilder._offset !== null) {
                                    result = result.slice(queryBuilder._offset);
                                }

                                if (queryBuilder._limit !== null) {
                                    result = result.slice(0, queryBuilder._limit);
                                }

                                if (queryBuilder._single) {
                                    if (result.length === 0) {
                                        resolve({ data: null, error: { code: 'PGRST116', message: 'No rows found' }, count: 0 });
                                    } else {
                                        resolve({ data: result[0], error: null, count: count });
                                    }
                                } else {
                                    resolve({ data: result, error: null, count: count });
                                }
                            } catch (err) {
                                if (reject) {
                                    reject(err);
                                } else {
                                    resolve({ data: null, error: { message: err.message }, count: 0 });
                                }
                            }
                        },

                        _applyFilters: function() {
                            var data = cloneData(this._data);

                            for (var i = 0; i < this._filters.length; i++) {
                                var filter = this._filters[i];

                                if (filter.operator === 'or') {
                                    // Handle or queries by splitting the filter string
                                    var orParts = filter.value.split(',');
                                    data = data.filter(function(row) {
                                        for (var j = 0; j < orParts.length; j++) {
                                            var part = orParts[j].trim();
                                            var match = part.match(/(\w+)\.(eq|ilike|like)\.(.+)/);
                                            if (match) {
                                                var orField = match[1];
                                                var orOp = match[2];
                                                var orValue = match[3].replace(/%/g, '');
                                                if (orOp === 'ilike' || orOp === 'like') {
                                                    if ((row[orField] || '').toLowerCase().indexOf(orValue.toLowerCase()) !== -1) {
                                                        return true;
                                                    }
                                                } else if (orOp === 'eq') {
                                                    if (row[orField] === orValue) {
                                                        return true;
                                                    }
                                                }
                                            }
                                        }
                                        return false;
                                    });
                                    continue;
                                }

                                data = data.filter(function(row) {
                                    var rowValue = row[filter.field];
                                    var filterValue = filter.value;

                                    switch (filter.operator) {
                                        case 'eq':
                                            return rowValue === filterValue;
                                        case 'neq':
                                            return rowValue !== filterValue;
                                        case 'gt':
                                            return rowValue > filterValue;
                                        case 'gte':
                                            return rowValue >= filterValue;
                                        case 'lt':
                                            return rowValue < filterValue;
                                        case 'lte':
                                            return rowValue <= filterValue;
                                        case 'ilike':
                                        case 'like':
                                            if (typeof filterValue === 'string') {
                                                var cleanValue = filterValue.replace(/%/g, '');
                                                return (String(rowValue || '')).toLowerCase().indexOf(cleanValue.toLowerCase()) !== -1;
                                            }
                                            return false;
                                        default:
                                            return true;
                                    }
                                });
                            }

                            return data;
                        }
                    };

                    return queryBuilder;
                },

                insert: function(data) {
                    var newRecords = Array.isArray(data) ? data : [data];
                    var inserted = [];

                    for (var i = 0; i < newRecords.length; i++) {
                        var record = cloneData(newRecords[i]);
                        record.id = record.id || generateId();
                        record.created_at = record.created_at || new Date().toISOString();
                        record.updated_at = record.updated_at || new Date().toISOString();

                        if (!mockDatabase[tableName]) {
                            mockDatabase[tableName] = [];
                        }
                        mockDatabase[tableName].push(record);
                        inserted.push(record);
                    }

                    console.log('📝 Mock insert into', tableName + ':', inserted.length, 'record(s)');

                    return {
                        select: function() {
                            return {
                                single: function() {
                                    return Promise.resolve({
                                        data: inserted[0],
                                        error: null
                                    });
                                },
                                then: function(resolve) {
                                    resolve({ data: inserted, error: null });
                                }
                            };
                        },
                        then: function(resolve) {
                            resolve({ data: inserted, error: null });
                        }
                    };
                },

                update: function(data) {
                    return {
                        eq: function(field, value) {
                            var updated = [];
                            if (mockDatabase[tableName]) {
                                for (var i = 0; i < mockDatabase[tableName].length; i++) {
                                    if (mockDatabase[tableName][i][field] === value) {
                                        Object.assign(mockDatabase[tableName][i], cloneData(data), {
                                            updated_at: new Date().toISOString()
                                        });
                                        updated.push(mockDatabase[tableName][i]);
                                    }
                                }
                            }

                            console.log('✏️ Mock update in', tableName + ':', updated.length, 'record(s)');

                            return {
                                select: function() {
                                    return {
                                        single: function() {
                                            return Promise.resolve({
                                                data: updated[0] || null,
                                                error: updated.length === 0 ? { message: 'No rows updated' } : null
                                            });
                                        },
                                        then: function(resolve) {
                                            resolve({ data: updated, error: null });
                                        }
                                    };
                                },
                                then: function(resolve) {
                                    resolve({ data: updated, error: null });
                                }
                            };
                        }
                    };
                },

                delete: function() {
                    return {
                        eq: function(field, value) {
                            var deleted = [];
                            if (mockDatabase[tableName]) {
                                mockDatabase[tableName] = mockDatabase[tableName].filter(function(record) {
                                    if (record[field] === value) {
                                        deleted.push(record);
                                        return false;
                                    }
                                    return true;
                                });
                            }

                            console.log('🗑️ Mock delete from', tableName + ':', deleted.length, 'record(s)');

                            return Promise.resolve({ data: deleted, error: null });
                        }
                    };
                },

                upsert: function(data) {
                    return this.insert(data);
                }
            };
        },

        storage: {
            from: function(bucketName) {
                return {
                    upload: function(path, file, options) {
                        console.log('📤 Mock upload to', bucketName + '/' + path);
                        return Promise.resolve({
                            data: { path: path, fullPath: bucketName + '/' + path },
                            error: null
                        });
                    },
                    download: function(path) {
                        console.log('📥 Mock download from', bucketName + '/' + path);
                        return Promise.resolve({
                            data: new Blob(['mock data']),
                            error: null
                        });
                    },
                    getPublicUrl: function(path) {
                        var url = SUPABASE_URL + '/storage/v1/object/public/' + bucketName + '/' + path;
                        return { data: { publicUrl: url } };
                    },
                    remove: function(paths) {
                        console.log('🗑️ Mock remove from', bucketName + ':', paths);
                        return Promise.resolve({ data: null, error: null });
                    },
                    list: function(folder) {
                        console.log('📋 Mock list from', bucketName + '/' + (folder || ''));
                        return Promise.resolve({
                            data: [],
                            error: null
                        });
                    }
                };
            }
        },

        rpc: function(functionName, params) {
            console.log('🔧 Mock RPC call:', functionName, params);
            return Promise.resolve({
                data: null,
                error: null
            });
        },

        channel: function(channelName) {
            console.log('📡 Mock realtime channel:', channelName);
            return {
                on: function() { return this; },
                subscribe: function(callback) {
                    if (callback) callback('SUBSCRIBED');
                    return this;
                },
                unsubscribe: function() { return this; },
                send: function() { return this; }
            };
        },

        removeChannel: function(channel) {
            console.log('🔌 Mock remove channel');
            return Promise.resolve();
        },

        removeAllChannels: function() {
            console.log('🔌 Mock remove all channels');
            return Promise.resolve();
        }
    };
}

// ============================================================
// AUTHENTICATION HELPERS
// ============================================================

var Auth = {
    /**
     * Get current authenticated user
     * @returns {Promise<Object|null>}
     */
    getUser: function() {
        if (!supabase) return Promise.resolve(null);
        return supabase.auth.getUser()
            .then(function(result) {
                if (result.error) throw result.error;
                return result.data.user;
            })
            .catch(function(err) {
                console.error('Get user error:', err.message);
                return null;
            });
    },

    /**
     * Get current session
     * @returns {Promise<Object|null>}
     */
    getSession: function() {
        if (!supabase) return Promise.resolve(null);
        return supabase.auth.getSession()
            .then(function(result) {
                if (result.error) throw result.error;
                return result.data.session;
            })
            .catch(function(err) {
                console.error('Get session error:', err.message);
                return null;
            });
    },

    /**
     * Get user profile from database
     * @param {string} userId
     * @returns {Promise<Object|null>}
     */
    getProfile: function(userId) {
        if (!supabase || !userId) return Promise.resolve(null);
        return supabase
            .from('profiles')
            .select('*')
            .eq('user_id', userId)
            .single()
            .then(function(result) {
                if (result.error && result.error.code !== 'PGRST116') throw result.error;
                return result.data || null;
            })
            .catch(function(err) {
                console.error('Get profile error:', err.message);
                return null;
            });
    },

    /**
     * Sign up with email and password
     * @param {string} email
     * @param {string} password
     * @param {string} fullName
     * @returns {Promise<Object>}
     */
    signUp: function(email, password, fullName) {
        if (!supabase) return Promise.resolve({ user: null, error: 'Supabase not configured' });
        return supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: { full_name: fullName },
                shouldCreateUser: true,
                emailRedirectTo: window.location.origin + '/auth/callback'
            }
        }).then(function(result) {
            if (result.error) throw result.error;
            return { user: result.data.user, error: null };
        }).catch(function(err) {
            return { user: null, error: err.message };
        });
    },

    /**
     * Sign in with email and password
     * @param {string} email
     * @param {string} password
     * @returns {Promise<Object>}
     */
    signIn: function(email, password) {
        if (!supabase) return Promise.resolve({ user: null, error: 'Supabase not configured' });
        return supabase.auth.signInWithPassword({
            email: email,
            password: password
        }).then(function(result) {
            if (result.error) throw result.error;
            return { user: result.data.user, error: null };
        }).catch(function(err) {
            return { user: null, error: err.message };
        });
    },

    /**
     * Sign in with Google OAuth
     * @returns {Promise<void>}
     */
    signInWithGoogle: function() {
        if (!supabase) return;
        return supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin + '/auth/callback',
                queryParams: {
                    access_type: 'offline',
                    prompt: 'consent'
                }
            }
        }).catch(function(err) {
            console.error('Google sign in error:', err.message);
        });
    },

    /**
     * Sign out current user
     * @returns {Promise<void>}
     */
    signOut: function() {
        if (!supabase) return Promise.resolve();
        return supabase.auth.signOut()
            .catch(function(err) {
                console.error('Sign out error:', err.message);
            });
    },

    /**
     * Reset password
     * @param {string} email
     * @returns {Promise<Object>}
     */
    resetPassword: function(email) {
        if (!supabase) return Promise.resolve({ error: 'Supabase not configured' });
        return supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/auth/reset-password'
        }).then(function(result) {
            if (result.error) throw result.error;
            return { error: null };
        }).catch(function(err) {
            return { error: err.message };
        });
    },

    /**
     * Update password
     * @param {string} newPassword
     * @returns {Promise<Object>}
     */
    updatePassword: function(newPassword) {
        if (!supabase) return Promise.resolve({ error: 'Supabase not configured' });
        return supabase.auth.updateUser({
            password: newPassword
        }).then(function(result) {
            if (result.error) throw result.error;
            return { error: null };
        }).catch(function(err) {
            return { error: err.message };
        });
    },

    /**
     * Listen for auth state changes
     * @param {Function} callback
     * @returns {Function} Unsubscribe function
     */
    onAuthStateChange: function(callback) {
        if (!supabase) {
            console.warn('Supabase not configured for auth state listener');
            return function() {};
        }
        var result = supabase.auth.onAuthStateChange(function(event, session) {
            callback(event, session);
        });
        return result.data.subscription.unsubscribe;
    }
};

// ============================================================
// DATABASE HELPERS
// ============================================================

var DB = {
    /**
     * Get system statistics
     * @returns {Promise<Object|null>}
     */
    getStats: function() {
        if (!supabase) return Promise.resolve(null);

        var today = new Date().toISOString().split('T')[0];

        return Promise.all([
            supabase.from('profiles').select('*', { count: 'exact', head: true }),
            supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('subscription_status', 'pro'),
            supabase.from('payment_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
            supabase.from('generations').select('*', { count: 'exact', head: true }).gte('created_at', today)
        ]).then(function(results) {
            return {
                totalUsers: (results[0] && results[0].count) || 0,
                proUsers: (results[1] && results[1].count) || 0,
                pendingPayments: (results[2] && results[2].count) || 0,
                todayGenerations: (results[3] && results[3].count) || 0
            };
        }).catch(function(err) {
            console.error('Get stats error:', err.message);
            return null;
        });
    },

    /**
     * Get users list with pagination
     * @param {number} page
     * @param {number} limit
     * @returns {Promise<Array>}
     */
    getUsers: function(page, limit) {
        page = page || 1;
        limit = limit || 20;

        if (!supabase) return Promise.resolve([]);

        var offset = (page - 1) * limit;
        return supabase
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1)
            .then(function(result) {
                if (result.error) throw result.error;
                return result.data || [];
            })
            .catch(function(err) {
                console.error('Get users error:', err.message);
                return [];
            });
    },

    /**
     * Search users by query
     * @param {string} query
     * @returns {Promise<Array>}
     */
    searchUsers: function(query) {
        if (!supabase || !query) return Promise.resolve([]);
        return supabase
            .from('profiles')
            .select('*')
            .or('email.ilike.%' + query + '%,full_name.ilike.%' + query + '%')
            .limit(20)
            .then(function(result) {
                if (result.error) throw result.error;
                return result.data || [];
            })
            .catch(function(err) {
                console.error('Search users error:', err.message);
                return [];
            });
    },

    /**
     * Get pending payments
     * @returns {Promise<Array>}
     */
    getPendingPayments: function() {
        if (!supabase) return Promise.resolve([]);
        return supabase
            .from('payment_requests')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
            .limit(20)
            .then(function(result) {
                if (result.error) throw result.error;
                return result.data || [];
            })
            .catch(function(err) {
                console.error('Get payments error:', err.message);
                return [];
            });
    },

    /**
     * Approve a payment and upgrade user to Pro
     * @param {string} paymentId
     * @param {string} userId
     * @returns {Promise<boolean>}
     */
    approvePayment: function(paymentId, userId) {
        if (!supabase) return Promise.resolve(false);
        return Promise.all([
            supabase.from('payment_requests').update({ status: 'approved', updated_at: new Date().toISOString() }).eq('id', paymentId),
            supabase.from('profiles').update({ subscription_status: 'pro', updated_at: new Date().toISOString() }).eq('user_id', userId)
        ]).then(function() {
            console.log('✅ Payment approved:', paymentId);
            return true;
        }).catch(function(err) {
            console.error('Approve payment error:', err.message);
            return false;
        });
    },

    /**
     * Reject a payment
     * @param {string} paymentId
     * @returns {Promise<boolean>}
     */
    rejectPayment: function(paymentId) {
        if (!supabase) return Promise.resolve(false);
        return supabase
            .from('payment_requests')
            .update({ status: 'rejected', updated_at: new Date().toISOString() })
            .eq('id', paymentId)
            .then(function() {
                console.log('❌ Payment rejected:', paymentId);
                return true;
            })
            .catch(function(err) {
                console.error('Reject payment error:', err.message);
                return false;
            });
    },

    /**
     * Get generation history
     * @param {number} page
     * @param {number} limit
     * @returns {Promise<Array>}
     */
    getGenerations: function(page, limit) {
        page = page || 1;
        limit = limit || 50;

        if (!supabase) return Promise.resolve([]);

        var offset = (page - 1) * limit;
        return supabase
            .from('generations')
            .select('*')
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1)
            .then(function(result) {
                if (result.error) throw result.error;
                return result.data || [];
            })
            .catch(function(err) {
                console.error('Get generations error:', err.message);
                return [];
            });
    },

    /**
     * Save a generation to history
     * @param {string} userId
     * @param {string} prompt
     * @param {string} response
     * @param {string} language
     * @param {string} task
     * @returns {Promise<Object|null>}
     */
    saveGeneration: function(userId, prompt, response, language, task) {
        if (!supabase || !userId) return Promise.resolve(null);
        return supabase
            .from('generations')
            .insert({
                user_id: userId,
                prompt: prompt,
                response: response,
                language: language || 'EN',
                task: task || 'generate',
                model: 'gemini-1.5-flash',
                created_at: new Date().toISOString()
            })
            .select()
            .single()
            .then(function(result) {
                if (result.error) throw result.error;
                return result.data;
            })
            .catch(function(err) {
                console.error('Save generation error:', err.message);
                return null;
            });
    },

    /**
     * Get user progress for Zîman
     * @param {string} userId
     * @param {string} languagePair
     * @returns {Promise<Object|null>}
     */
    getUserProgress: function(userId, languagePair) {
        if (!supabase || !userId) return Promise.resolve(null);
        return supabase
            .from('user_progress')
            .select('*')
            .eq('user_id', userId)
            .eq('language_pair', languagePair || 'en-ku')
            .single()
            .then(function(result) {
                if (result.error && result.error.code !== 'PGRST116') throw result.error;
                return result.data || null;
            })
            .catch(function(err) {
                console.error('Get progress error:', err.message);
                return null;
            });
    },

    /**
     * Get vocabulary words
     * @param {string} languagePair
     * @param {string} category
     * @param {number} limit
     * @returns {Promise<Array>}
     */
    getVocabulary: function(languagePair, category, limit) {
        if (!supabase) return Promise.resolve([]);
        var query = supabase
            .from('vocabulary')
            .select('*')
            .eq('language_pair', languagePair || 'en-ku')
            .limit(limit || 50);

        if (category) {
            query = query.eq('category', category);
        }

        return query.then(function(result) {
            if (result.error) throw result.error;
            return result.data || [];
        }).catch(function(err) {
            console.error('Get vocabulary error:', err.message);
            return [];
        });
    },

    /**
     * Update user profile
     * @param {string} userId
     * @param {Object} updates
     * @returns {Promise<boolean>}
     */
    updateProfile: function(userId, updates) {
        if (!supabase || !userId) return Promise.resolve(false);
        updates.updated_at = new Date().toISOString();
        return supabase
            .from('profiles')
            .update(updates)
            .eq('user_id', userId)
            .then(function(result) {
                if (result.error) throw result.error;
                return true;
            })
            .catch(function(err) {
                console.error('Update profile error:', err.message);
                return false;
            });
    },

    /**
     * Record a profile visit
     * @param {string} ownerId
     * @param {string} visitorId
     * @returns {Promise<void>}
     */
    recordProfileVisit: function(ownerId, visitorId) {
        if (!supabase || !ownerId) return Promise.resolve();
        return supabase
            .from('profile_visits')
            .insert({
                profile_owner_id: ownerId,
                visitor_id: visitorId || null,
                ip_address: 'client',
                created_at: new Date().toISOString()
            })
            .then(function() {
                // Silent success
            })
            .catch(function(err) {
                console.error('Record visit error:', err.message);
            });
    }
};

// ============================================================
// EXPORT TO GLOBAL SCOPE
// ============================================================

window.supabaseClient = supabase;
window.SUPABASE_URL = SUPABASE_URL;
window.Auth = Auth;
window.DB = DB;

// Log status
if (isSupabaseReady) {
    console.log('✨ Luminary AI Supabase Client Ready');
    console.log('🔗 Connected to:', SUPABASE_URL);
    console.log('🔐 Auth: Ready');
    console.log('📊 Database: Ready');
    console.log('📦 Storage: Ready');
} else {
    console.log('📝 Luminary AI running in Demo Mode');
    console.log('💡 All features are functional with mock data');
    console.log('🔗 Connect to Supabase for full database functionality');
}

console.log('👨‍💻 Developer: Zaniyar Al-Mzurii');
