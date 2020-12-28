
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.29.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
                    }
                    if (run_queue) {
                        for (let i = 0; i < subscriber_queue.length; i += 2) {
                            subscriber_queue[i][0](subscriber_queue[i + 1]);
                        }
                        subscriber_queue.length = 0;
                    }
                }
            }
        }
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    var isMergeableObject = function isMergeableObject(value) {
    	return isNonNullObject(value)
    		&& !isSpecial(value)
    };

    function isNonNullObject(value) {
    	return !!value && typeof value === 'object'
    }

    function isSpecial(value) {
    	var stringValue = Object.prototype.toString.call(value);

    	return stringValue === '[object RegExp]'
    		|| stringValue === '[object Date]'
    		|| isReactElement(value)
    }

    // see https://github.com/facebook/react/blob/b5ac963fb791d1298e7f396236383bc955f916c1/src/isomorphic/classic/element/ReactElement.js#L21-L25
    var canUseSymbol = typeof Symbol === 'function' && Symbol.for;
    var REACT_ELEMENT_TYPE = canUseSymbol ? Symbol.for('react.element') : 0xeac7;

    function isReactElement(value) {
    	return value.$$typeof === REACT_ELEMENT_TYPE
    }

    function emptyTarget(val) {
    	return Array.isArray(val) ? [] : {}
    }

    function cloneUnlessOtherwiseSpecified(value, options) {
    	return (options.clone !== false && options.isMergeableObject(value))
    		? deepmerge(emptyTarget(value), value, options)
    		: value
    }

    function defaultArrayMerge(target, source, options) {
    	return target.concat(source).map(function(element) {
    		return cloneUnlessOtherwiseSpecified(element, options)
    	})
    }

    function getMergeFunction(key, options) {
    	if (!options.customMerge) {
    		return deepmerge
    	}
    	var customMerge = options.customMerge(key);
    	return typeof customMerge === 'function' ? customMerge : deepmerge
    }

    function getEnumerableOwnPropertySymbols(target) {
    	return Object.getOwnPropertySymbols
    		? Object.getOwnPropertySymbols(target).filter(function(symbol) {
    			return target.propertyIsEnumerable(symbol)
    		})
    		: []
    }

    function getKeys(target) {
    	return Object.keys(target).concat(getEnumerableOwnPropertySymbols(target))
    }

    function propertyIsOnObject(object, property) {
    	try {
    		return property in object
    	} catch(_) {
    		return false
    	}
    }

    // Protects from prototype poisoning and unexpected merging up the prototype chain.
    function propertyIsUnsafe(target, key) {
    	return propertyIsOnObject(target, key) // Properties are safe to merge if they don't exist in the target yet,
    		&& !(Object.hasOwnProperty.call(target, key) // unsafe if they exist up the prototype chain,
    			&& Object.propertyIsEnumerable.call(target, key)) // and also unsafe if they're nonenumerable.
    }

    function mergeObject(target, source, options) {
    	var destination = {};
    	if (options.isMergeableObject(target)) {
    		getKeys(target).forEach(function(key) {
    			destination[key] = cloneUnlessOtherwiseSpecified(target[key], options);
    		});
    	}
    	getKeys(source).forEach(function(key) {
    		if (propertyIsUnsafe(target, key)) {
    			return
    		}

    		if (propertyIsOnObject(target, key) && options.isMergeableObject(source[key])) {
    			destination[key] = getMergeFunction(key, options)(target[key], source[key], options);
    		} else {
    			destination[key] = cloneUnlessOtherwiseSpecified(source[key], options);
    		}
    	});
    	return destination
    }

    function deepmerge(target, source, options) {
    	options = options || {};
    	options.arrayMerge = options.arrayMerge || defaultArrayMerge;
    	options.isMergeableObject = options.isMergeableObject || isMergeableObject;
    	// cloneUnlessOtherwiseSpecified is added to `options` so that custom arrayMerge()
    	// implementations can use it. The caller may not replace it.
    	options.cloneUnlessOtherwiseSpecified = cloneUnlessOtherwiseSpecified;

    	var sourceIsArray = Array.isArray(source);
    	var targetIsArray = Array.isArray(target);
    	var sourceAndTargetTypesMatch = sourceIsArray === targetIsArray;

    	if (!sourceAndTargetTypesMatch) {
    		return cloneUnlessOtherwiseSpecified(source, options)
    	} else if (sourceIsArray) {
    		return options.arrayMerge(target, source, options)
    	} else {
    		return mergeObject(target, source, options)
    	}
    }

    deepmerge.all = function deepmergeAll(array, options) {
    	if (!Array.isArray(array)) {
    		throw new Error('first argument should be an array')
    	}

    	return array.reduce(function(prev, next) {
    		return deepmerge(prev, next, options)
    	}, {})
    };

    var deepmerge_1 = deepmerge;

    var cjs = deepmerge_1;

    function createCommonjsModule(fn, module) {
    	return module = { exports: {} }, fn(module, module.exports), module.exports;
    }

    var dlv_umd = createCommonjsModule(function (module, exports) {
    !function(t,n){module.exports=function(t,n,e,i,o){for(n=n.split?n.split("."):n,i=0;i<n.length;i++)t=t?t[n[i]]:o;return t===o?e:t};}();
    //# sourceMappingURL=dlv.umd.js.map
    });

    /*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */
    /* global Reflect, Promise */

    var extendStatics = function(d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };

    function __extends(d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    }

    var __assign = function() {
        __assign = Object.assign || function __assign(t) {
            for (var s, i = 1, n = arguments.length; i < n; i++) {
                s = arguments[i];
                for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
            }
            return t;
        };
        return __assign.apply(this, arguments);
    };

    function __spreadArrays() {
        for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
        for (var r = Array(s), k = 0, i = 0; i < il; i++)
            for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
                r[k] = a[j];
        return r;
    }

    var TYPE;
    (function (TYPE) {
        /**
         * Raw text
         */
        TYPE[TYPE["literal"] = 0] = "literal";
        /**
         * Variable w/o any format, e.g `var` in `this is a {var}`
         */
        TYPE[TYPE["argument"] = 1] = "argument";
        /**
         * Variable w/ number format
         */
        TYPE[TYPE["number"] = 2] = "number";
        /**
         * Variable w/ date format
         */
        TYPE[TYPE["date"] = 3] = "date";
        /**
         * Variable w/ time format
         */
        TYPE[TYPE["time"] = 4] = "time";
        /**
         * Variable w/ select format
         */
        TYPE[TYPE["select"] = 5] = "select";
        /**
         * Variable w/ plural format
         */
        TYPE[TYPE["plural"] = 6] = "plural";
        /**
         * Only possible within plural argument.
         * This is the `#` symbol that will be substituted with the count.
         */
        TYPE[TYPE["pound"] = 7] = "pound";
        /**
         * XML-like tag
         */
        TYPE[TYPE["tag"] = 8] = "tag";
    })(TYPE || (TYPE = {}));
    var SKELETON_TYPE;
    (function (SKELETON_TYPE) {
        SKELETON_TYPE[SKELETON_TYPE["number"] = 0] = "number";
        SKELETON_TYPE[SKELETON_TYPE["dateTime"] = 1] = "dateTime";
    })(SKELETON_TYPE || (SKELETON_TYPE = {}));
    /**
     * Type Guards
     */
    function isLiteralElement(el) {
        return el.type === TYPE.literal;
    }
    function isArgumentElement(el) {
        return el.type === TYPE.argument;
    }
    function isNumberElement(el) {
        return el.type === TYPE.number;
    }
    function isDateElement(el) {
        return el.type === TYPE.date;
    }
    function isTimeElement(el) {
        return el.type === TYPE.time;
    }
    function isSelectElement(el) {
        return el.type === TYPE.select;
    }
    function isPluralElement(el) {
        return el.type === TYPE.plural;
    }
    function isPoundElement(el) {
        return el.type === TYPE.pound;
    }
    function isTagElement(el) {
        return el.type === TYPE.tag;
    }
    function isNumberSkeleton(el) {
        return !!(el && typeof el === 'object' && el.type === 0 /* number */);
    }
    function isDateTimeSkeleton(el) {
        return !!(el && typeof el === 'object' && el.type === 1 /* dateTime */);
    }

    /**
     * https://unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table
     * Credit: https://github.com/caridy/intl-datetimeformat-pattern/blob/master/index.js
     * with some tweaks
     */
    var DATE_TIME_REGEX = /(?:[Eec]{1,6}|G{1,5}|[Qq]{1,5}|(?:[yYur]+|U{1,5})|[ML]{1,5}|d{1,2}|D{1,3}|F{1}|[abB]{1,5}|[hkHK]{1,2}|w{1,2}|W{1}|m{1,2}|s{1,2}|[zZOvVxX]{1,4})(?=([^']*'[^']*')*[^']*$)/g;
    /**
     * Parse Date time skeleton into Intl.DateTimeFormatOptions
     * Ref: https://unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table
     * @public
     * @param skeleton skeleton string
     */
    function parseDateTimeSkeleton(skeleton) {
        var result = {};
        skeleton.replace(DATE_TIME_REGEX, function (match) {
            var len = match.length;
            switch (match[0]) {
                // Era
                case 'G':
                    result.era = len === 4 ? 'long' : len === 5 ? 'narrow' : 'short';
                    break;
                // Year
                case 'y':
                    result.year = len === 2 ? '2-digit' : 'numeric';
                    break;
                case 'Y':
                case 'u':
                case 'U':
                case 'r':
                    throw new RangeError('`Y/u/U/r` (year) patterns are not supported, use `y` instead');
                // Quarter
                case 'q':
                case 'Q':
                    throw new RangeError('`q/Q` (quarter) patterns are not supported');
                // Month
                case 'M':
                case 'L':
                    result.month = ['numeric', '2-digit', 'short', 'long', 'narrow'][len - 1];
                    break;
                // Week
                case 'w':
                case 'W':
                    throw new RangeError('`w/W` (week) patterns are not supported');
                case 'd':
                    result.day = ['numeric', '2-digit'][len - 1];
                    break;
                case 'D':
                case 'F':
                case 'g':
                    throw new RangeError('`D/F/g` (day) patterns are not supported, use `d` instead');
                // Weekday
                case 'E':
                    result.weekday = len === 4 ? 'short' : len === 5 ? 'narrow' : 'short';
                    break;
                case 'e':
                    if (len < 4) {
                        throw new RangeError('`e..eee` (weekday) patterns are not supported');
                    }
                    result.weekday = ['short', 'long', 'narrow', 'short'][len - 4];
                    break;
                case 'c':
                    if (len < 4) {
                        throw new RangeError('`c..ccc` (weekday) patterns are not supported');
                    }
                    result.weekday = ['short', 'long', 'narrow', 'short'][len - 4];
                    break;
                // Period
                case 'a': // AM, PM
                    result.hour12 = true;
                    break;
                case 'b': // am, pm, noon, midnight
                case 'B': // flexible day periods
                    throw new RangeError('`b/B` (period) patterns are not supported, use `a` instead');
                // Hour
                case 'h':
                    result.hourCycle = 'h12';
                    result.hour = ['numeric', '2-digit'][len - 1];
                    break;
                case 'H':
                    result.hourCycle = 'h23';
                    result.hour = ['numeric', '2-digit'][len - 1];
                    break;
                case 'K':
                    result.hourCycle = 'h11';
                    result.hour = ['numeric', '2-digit'][len - 1];
                    break;
                case 'k':
                    result.hourCycle = 'h24';
                    result.hour = ['numeric', '2-digit'][len - 1];
                    break;
                case 'j':
                case 'J':
                case 'C':
                    throw new RangeError('`j/J/C` (hour) patterns are not supported, use `h/H/K/k` instead');
                // Minute
                case 'm':
                    result.minute = ['numeric', '2-digit'][len - 1];
                    break;
                // Second
                case 's':
                    result.second = ['numeric', '2-digit'][len - 1];
                    break;
                case 'S':
                case 'A':
                    throw new RangeError('`S/A` (second) patterns are not supported, use `s` instead');
                // Zone
                case 'z': // 1..3, 4: specific non-location format
                    result.timeZoneName = len < 4 ? 'short' : 'long';
                    break;
                case 'Z': // 1..3, 4, 5: The ISO8601 varios formats
                case 'O': // 1, 4: miliseconds in day short, long
                case 'v': // 1, 4: generic non-location format
                case 'V': // 1, 2, 3, 4: time zone ID or city
                case 'X': // 1, 2, 3, 4: The ISO8601 varios formats
                case 'x': // 1, 2, 3, 4: The ISO8601 varios formats
                    throw new RangeError('`Z/O/v/V/X/x` (timeZone) patterns are not supported, use `z` instead');
            }
            return '';
        });
        return result;
    }
    function icuUnitToEcma(unit) {
        return unit.replace(/^(.*?)-/, '');
    }
    var FRACTION_PRECISION_REGEX = /^\.(?:(0+)(\*)?|(#+)|(0+)(#+))$/g;
    var SIGNIFICANT_PRECISION_REGEX = /^(@+)?(\+|#+)?$/g;
    function parseSignificantPrecision(str) {
        var result = {};
        str.replace(SIGNIFICANT_PRECISION_REGEX, function (_, g1, g2) {
            // @@@ case
            if (typeof g2 !== 'string') {
                result.minimumSignificantDigits = g1.length;
                result.maximumSignificantDigits = g1.length;
            }
            // @@@+ case
            else if (g2 === '+') {
                result.minimumSignificantDigits = g1.length;
            }
            // .### case
            else if (g1[0] === '#') {
                result.maximumSignificantDigits = g1.length;
            }
            // .@@## or .@@@ case
            else {
                result.minimumSignificantDigits = g1.length;
                result.maximumSignificantDigits =
                    g1.length + (typeof g2 === 'string' ? g2.length : 0);
            }
            return '';
        });
        return result;
    }
    function parseSign(str) {
        switch (str) {
            case 'sign-auto':
                return {
                    signDisplay: 'auto',
                };
            case 'sign-accounting':
                return {
                    currencySign: 'accounting',
                };
            case 'sign-always':
                return {
                    signDisplay: 'always',
                };
            case 'sign-accounting-always':
                return {
                    signDisplay: 'always',
                    currencySign: 'accounting',
                };
            case 'sign-except-zero':
                return {
                    signDisplay: 'exceptZero',
                };
            case 'sign-accounting-except-zero':
                return {
                    signDisplay: 'exceptZero',
                    currencySign: 'accounting',
                };
            case 'sign-never':
                return {
                    signDisplay: 'never',
                };
        }
    }
    function parseNotationOptions(opt) {
        var result = {};
        var signOpts = parseSign(opt);
        if (signOpts) {
            return signOpts;
        }
        return result;
    }
    /**
     * https://github.com/unicode-org/icu/blob/master/docs/userguide/format_parse/numbers/skeletons.md#skeleton-stems-and-options
     */
    function parseNumberSkeleton(tokens) {
        var result = {};
        for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
            var token = tokens_1[_i];
            switch (token.stem) {
                case 'percent':
                    result.style = 'percent';
                    continue;
                case 'currency':
                    result.style = 'currency';
                    result.currency = token.options[0];
                    continue;
                case 'group-off':
                    result.useGrouping = false;
                    continue;
                case 'precision-integer':
                case '.':
                    result.maximumFractionDigits = 0;
                    continue;
                case 'measure-unit':
                    result.style = 'unit';
                    result.unit = icuUnitToEcma(token.options[0]);
                    continue;
                case 'compact-short':
                    result.notation = 'compact';
                    result.compactDisplay = 'short';
                    continue;
                case 'compact-long':
                    result.notation = 'compact';
                    result.compactDisplay = 'long';
                    continue;
                case 'scientific':
                    result = __assign(__assign(__assign({}, result), { notation: 'scientific' }), token.options.reduce(function (all, opt) { return (__assign(__assign({}, all), parseNotationOptions(opt))); }, {}));
                    continue;
                case 'engineering':
                    result = __assign(__assign(__assign({}, result), { notation: 'engineering' }), token.options.reduce(function (all, opt) { return (__assign(__assign({}, all), parseNotationOptions(opt))); }, {}));
                    continue;
                case 'notation-simple':
                    result.notation = 'standard';
                    continue;
                // https://github.com/unicode-org/icu/blob/master/icu4c/source/i18n/unicode/unumberformatter.h
                case 'unit-width-narrow':
                    result.currencyDisplay = 'narrowSymbol';
                    result.unitDisplay = 'narrow';
                    continue;
                case 'unit-width-short':
                    result.currencyDisplay = 'code';
                    result.unitDisplay = 'short';
                    continue;
                case 'unit-width-full-name':
                    result.currencyDisplay = 'name';
                    result.unitDisplay = 'long';
                    continue;
                case 'unit-width-iso-code':
                    result.currencyDisplay = 'symbol';
                    continue;
                case 'scale':
                    result.scale = parseFloat(token.options[0]);
                    continue;
            }
            // Precision
            // https://github.com/unicode-org/icu/blob/master/docs/userguide/format_parse/numbers/skeletons.md#fraction-precision
            // precision-integer case
            if (FRACTION_PRECISION_REGEX.test(token.stem)) {
                if (token.options.length > 1) {
                    throw new RangeError('Fraction-precision stems only accept a single optional option');
                }
                token.stem.replace(FRACTION_PRECISION_REGEX, function (_, g1, g2, g3, g4, g5) {
                    // .000* case (before ICU67 it was .000+)
                    if (g2 === '*') {
                        result.minimumFractionDigits = g1.length;
                    }
                    // .### case
                    else if (g3 && g3[0] === '#') {
                        result.maximumFractionDigits = g3.length;
                    }
                    // .00## case
                    else if (g4 && g5) {
                        result.minimumFractionDigits = g4.length;
                        result.maximumFractionDigits = g4.length + g5.length;
                    }
                    else {
                        result.minimumFractionDigits = g1.length;
                        result.maximumFractionDigits = g1.length;
                    }
                    return '';
                });
                if (token.options.length) {
                    result = __assign(__assign({}, result), parseSignificantPrecision(token.options[0]));
                }
                continue;
            }
            if (SIGNIFICANT_PRECISION_REGEX.test(token.stem)) {
                result = __assign(__assign({}, result), parseSignificantPrecision(token.stem));
                continue;
            }
            var signOpts = parseSign(token.stem);
            if (signOpts) {
                result = __assign(__assign({}, result), signOpts);
            }
        }
        return result;
    }

    // @ts-nocheck
    var SyntaxError = /** @class */ (function (_super) {
        __extends(SyntaxError, _super);
        function SyntaxError(message, expected, found, location) {
            var _this = _super.call(this) || this;
            _this.message = message;
            _this.expected = expected;
            _this.found = found;
            _this.location = location;
            _this.name = "SyntaxError";
            if (typeof Error.captureStackTrace === "function") {
                Error.captureStackTrace(_this, SyntaxError);
            }
            return _this;
        }
        SyntaxError.buildMessage = function (expected, found) {
            function hex(ch) {
                return ch.charCodeAt(0).toString(16).toUpperCase();
            }
            function literalEscape(s) {
                return s
                    .replace(/\\/g, "\\\\")
                    .replace(/"/g, "\\\"")
                    .replace(/\0/g, "\\0")
                    .replace(/\t/g, "\\t")
                    .replace(/\n/g, "\\n")
                    .replace(/\r/g, "\\r")
                    .replace(/[\x00-\x0F]/g, function (ch) { return "\\x0" + hex(ch); })
                    .replace(/[\x10-\x1F\x7F-\x9F]/g, function (ch) { return "\\x" + hex(ch); });
            }
            function classEscape(s) {
                return s
                    .replace(/\\/g, "\\\\")
                    .replace(/\]/g, "\\]")
                    .replace(/\^/g, "\\^")
                    .replace(/-/g, "\\-")
                    .replace(/\0/g, "\\0")
                    .replace(/\t/g, "\\t")
                    .replace(/\n/g, "\\n")
                    .replace(/\r/g, "\\r")
                    .replace(/[\x00-\x0F]/g, function (ch) { return "\\x0" + hex(ch); })
                    .replace(/[\x10-\x1F\x7F-\x9F]/g, function (ch) { return "\\x" + hex(ch); });
            }
            function describeExpectation(expectation) {
                switch (expectation.type) {
                    case "literal":
                        return "\"" + literalEscape(expectation.text) + "\"";
                    case "class":
                        var escapedParts = expectation.parts.map(function (part) {
                            return Array.isArray(part)
                                ? classEscape(part[0]) + "-" + classEscape(part[1])
                                : classEscape(part);
                        });
                        return "[" + (expectation.inverted ? "^" : "") + escapedParts + "]";
                    case "any":
                        return "any character";
                    case "end":
                        return "end of input";
                    case "other":
                        return expectation.description;
                }
            }
            function describeExpected(expected1) {
                var descriptions = expected1.map(describeExpectation);
                var i;
                var j;
                descriptions.sort();
                if (descriptions.length > 0) {
                    for (i = 1, j = 1; i < descriptions.length; i++) {
                        if (descriptions[i - 1] !== descriptions[i]) {
                            descriptions[j] = descriptions[i];
                            j++;
                        }
                    }
                    descriptions.length = j;
                }
                switch (descriptions.length) {
                    case 1:
                        return descriptions[0];
                    case 2:
                        return descriptions[0] + " or " + descriptions[1];
                    default:
                        return descriptions.slice(0, -1).join(", ")
                            + ", or "
                            + descriptions[descriptions.length - 1];
                }
            }
            function describeFound(found1) {
                return found1 ? "\"" + literalEscape(found1) + "\"" : "end of input";
            }
            return "Expected " + describeExpected(expected) + " but " + describeFound(found) + " found.";
        };
        return SyntaxError;
    }(Error));
    function peg$parse(input, options) {
        options = options !== undefined ? options : {};
        var peg$FAILED = {};
        var peg$startRuleFunctions = { start: peg$parsestart };
        var peg$startRuleFunction = peg$parsestart;
        var peg$c0 = function () { return !ignoreTag; };
        var peg$c1 = function (x) { return x; };
        var peg$c2 = function () { return ignoreTag; };
        var peg$c3 = "<";
        var peg$c4 = peg$literalExpectation("<", false);
        var peg$c5 = function (parts) {
            return parts.join('');
        };
        var peg$c6 = function () { return '<'; };
        var peg$c7 = function (messageText) {
            return __assign({ type: TYPE.literal, value: messageText }, insertLocation());
        };
        var peg$c8 = "#";
        var peg$c9 = peg$literalExpectation("#", false);
        var peg$c10 = function () {
            return __assign({ type: TYPE.pound }, insertLocation());
        };
        var peg$c11 = peg$otherExpectation("tagElement");
        var peg$c12 = function (open, children, close) {
            if (open !== close) {
                error("Mismatch tag \"" + open + "\" !== \"" + close + "\"", location());
            }
            return __assign({ type: TYPE.tag, value: open, children: children }, insertLocation());
        };
        var peg$c13 = "/>";
        var peg$c14 = peg$literalExpectation("/>", false);
        var peg$c15 = function (value) {
            return __assign({ type: TYPE.literal, value: value.join('') }, insertLocation());
        };
        var peg$c16 = ">";
        var peg$c17 = peg$literalExpectation(">", false);
        var peg$c18 = function (tag) { return tag; };
        var peg$c19 = "</";
        var peg$c20 = peg$literalExpectation("</", false);
        var peg$c21 = peg$otherExpectation("argumentElement");
        var peg$c22 = "{";
        var peg$c23 = peg$literalExpectation("{", false);
        var peg$c24 = "}";
        var peg$c25 = peg$literalExpectation("}", false);
        var peg$c26 = function (value) {
            return __assign({ type: TYPE.argument, value: value }, insertLocation());
        };
        var peg$c27 = peg$otherExpectation("numberSkeletonId");
        var peg$c28 = /^['\/{}]/;
        var peg$c29 = peg$classExpectation(["'", "/", "{", "}"], false, false);
        var peg$c30 = peg$anyExpectation();
        var peg$c31 = peg$otherExpectation("numberSkeletonTokenOption");
        var peg$c32 = "/";
        var peg$c33 = peg$literalExpectation("/", false);
        var peg$c34 = function (option) { return option; };
        var peg$c35 = peg$otherExpectation("numberSkeletonToken");
        var peg$c36 = function (stem, options) {
            return { stem: stem, options: options };
        };
        var peg$c37 = function (tokens) {
            return __assign({ type: 0 /* number */, tokens: tokens, parsedOptions: shouldParseSkeleton ? parseNumberSkeleton(tokens) : {} }, insertLocation());
        };
        var peg$c38 = "::";
        var peg$c39 = peg$literalExpectation("::", false);
        var peg$c40 = function (skeleton) { return skeleton; };
        var peg$c41 = function () { messageCtx.push('numberArgStyle'); return true; };
        var peg$c42 = function (style) {
            messageCtx.pop();
            return style.replace(/\s*$/, '');
        };
        var peg$c43 = ",";
        var peg$c44 = peg$literalExpectation(",", false);
        var peg$c45 = "number";
        var peg$c46 = peg$literalExpectation("number", false);
        var peg$c47 = function (value, type, style) {
            return __assign({ type: type === 'number' ? TYPE.number : type === 'date' ? TYPE.date : TYPE.time, style: style && style[2], value: value }, insertLocation());
        };
        var peg$c48 = "'";
        var peg$c49 = peg$literalExpectation("'", false);
        var peg$c50 = /^[^']/;
        var peg$c51 = peg$classExpectation(["'"], true, false);
        var peg$c52 = /^[^a-zA-Z'{}]/;
        var peg$c53 = peg$classExpectation([["a", "z"], ["A", "Z"], "'", "{", "}"], true, false);
        var peg$c54 = /^[a-zA-Z]/;
        var peg$c55 = peg$classExpectation([["a", "z"], ["A", "Z"]], false, false);
        var peg$c56 = function (pattern) {
            return __assign({ type: 1 /* dateTime */, pattern: pattern, parsedOptions: shouldParseSkeleton ? parseDateTimeSkeleton(pattern) : {} }, insertLocation());
        };
        var peg$c57 = function () { messageCtx.push('dateOrTimeArgStyle'); return true; };
        var peg$c58 = "date";
        var peg$c59 = peg$literalExpectation("date", false);
        var peg$c60 = "time";
        var peg$c61 = peg$literalExpectation("time", false);
        var peg$c62 = "plural";
        var peg$c63 = peg$literalExpectation("plural", false);
        var peg$c64 = "selectordinal";
        var peg$c65 = peg$literalExpectation("selectordinal", false);
        var peg$c66 = "offset:";
        var peg$c67 = peg$literalExpectation("offset:", false);
        var peg$c68 = function (value, pluralType, offset, options) {
            return __assign({ type: TYPE.plural, pluralType: pluralType === 'plural' ? 'cardinal' : 'ordinal', value: value, offset: offset ? offset[2] : 0, options: options.reduce(function (all, _a) {
                    var id = _a.id, value = _a.value, optionLocation = _a.location;
                    if (id in all) {
                        error("Duplicate option \"" + id + "\" in plural element: \"" + text() + "\"", location());
                    }
                    all[id] = {
                        value: value,
                        location: optionLocation
                    };
                    return all;
                }, {}) }, insertLocation());
        };
        var peg$c69 = "select";
        var peg$c70 = peg$literalExpectation("select", false);
        var peg$c71 = function (value, options) {
            return __assign({ type: TYPE.select, value: value, options: options.reduce(function (all, _a) {
                    var id = _a.id, value = _a.value, optionLocation = _a.location;
                    if (id in all) {
                        error("Duplicate option \"" + id + "\" in select element: \"" + text() + "\"", location());
                    }
                    all[id] = {
                        value: value,
                        location: optionLocation
                    };
                    return all;
                }, {}) }, insertLocation());
        };
        var peg$c72 = "=";
        var peg$c73 = peg$literalExpectation("=", false);
        var peg$c74 = function (id) { messageCtx.push('select'); return true; };
        var peg$c75 = function (id, value) {
            messageCtx.pop();
            return __assign({ id: id,
                value: value }, insertLocation());
        };
        var peg$c76 = function (id) { messageCtx.push('plural'); return true; };
        var peg$c77 = function (id, value) {
            messageCtx.pop();
            return __assign({ id: id,
                value: value }, insertLocation());
        };
        var peg$c78 = peg$otherExpectation("whitespace");
        var peg$c79 = /^[\t-\r \x85\xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]/;
        var peg$c80 = peg$classExpectation([["\t", "\r"], " ", "\x85", "\xA0", "\u1680", ["\u2000", "\u200A"], "\u2028", "\u2029", "\u202F", "\u205F", "\u3000"], false, false);
        var peg$c81 = peg$otherExpectation("syntax pattern");
        var peg$c82 = /^[!-\/:-@[-\^`{-~\xA1-\xA7\xA9\xAB\xAC\xAE\xB0\xB1\xB6\xBB\xBF\xD7\xF7\u2010-\u2027\u2030-\u203E\u2041-\u2053\u2055-\u205E\u2190-\u245F\u2500-\u2775\u2794-\u2BFF\u2E00-\u2E7F\u3001-\u3003\u3008-\u3020\u3030\uFD3E\uFD3F\uFE45\uFE46]/;
        var peg$c83 = peg$classExpectation([["!", "/"], [":", "@"], ["[", "^"], "`", ["{", "~"], ["\xA1", "\xA7"], "\xA9", "\xAB", "\xAC", "\xAE", "\xB0", "\xB1", "\xB6", "\xBB", "\xBF", "\xD7", "\xF7", ["\u2010", "\u2027"], ["\u2030", "\u203E"], ["\u2041", "\u2053"], ["\u2055", "\u205E"], ["\u2190", "\u245F"], ["\u2500", "\u2775"], ["\u2794", "\u2BFF"], ["\u2E00", "\u2E7F"], ["\u3001", "\u3003"], ["\u3008", "\u3020"], "\u3030", "\uFD3E", "\uFD3F", "\uFE45", "\uFE46"], false, false);
        var peg$c84 = peg$otherExpectation("optional whitespace");
        var peg$c85 = peg$otherExpectation("number");
        var peg$c86 = "-";
        var peg$c87 = peg$literalExpectation("-", false);
        var peg$c88 = function (negative, num) {
            return num
                ? negative
                    ? -num
                    : num
                : 0;
        };
        var peg$c90 = peg$otherExpectation("double apostrophes");
        var peg$c91 = "''";
        var peg$c92 = peg$literalExpectation("''", false);
        var peg$c93 = function () { return "'"; };
        var peg$c94 = function (escapedChar, quotedChars) {
            return escapedChar + quotedChars.replace("''", "'");
        };
        var peg$c95 = function (x) {
            return (x !== '<' &&
                x !== '{' &&
                !(isInPluralOption() && x === '#') &&
                !(isNestedMessageText() && x === '}'));
        };
        var peg$c96 = "\n";
        var peg$c97 = peg$literalExpectation("\n", false);
        var peg$c98 = function (x) {
            return x === '<' || x === '>' || x === '{' || x === '}' || (isInPluralOption() && x === '#');
        };
        var peg$c99 = peg$otherExpectation("argNameOrNumber");
        var peg$c100 = peg$otherExpectation("validTag");
        var peg$c101 = peg$otherExpectation("argNumber");
        var peg$c102 = "0";
        var peg$c103 = peg$literalExpectation("0", false);
        var peg$c104 = function () { return 0; };
        var peg$c105 = /^[1-9]/;
        var peg$c106 = peg$classExpectation([["1", "9"]], false, false);
        var peg$c107 = /^[0-9]/;
        var peg$c108 = peg$classExpectation([["0", "9"]], false, false);
        var peg$c109 = function (digits) {
            return parseInt(digits.join(''), 10);
        };
        var peg$c110 = peg$otherExpectation("argName");
        var peg$c111 = peg$otherExpectation("tagName");
        var peg$currPos = 0;
        var peg$savedPos = 0;
        var peg$posDetailsCache = [{ line: 1, column: 1 }];
        var peg$maxFailPos = 0;
        var peg$maxFailExpected = [];
        var peg$silentFails = 0;
        var peg$result;
        if (options.startRule !== undefined) {
            if (!(options.startRule in peg$startRuleFunctions)) {
                throw new Error("Can't start parsing from rule \"" + options.startRule + "\".");
            }
            peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
        }
        function text() {
            return input.substring(peg$savedPos, peg$currPos);
        }
        function location() {
            return peg$computeLocation(peg$savedPos, peg$currPos);
        }
        function error(message, location1) {
            location1 = location1 !== undefined
                ? location1
                : peg$computeLocation(peg$savedPos, peg$currPos);
            throw peg$buildSimpleError(message, location1);
        }
        function peg$literalExpectation(text1, ignoreCase) {
            return { type: "literal", text: text1, ignoreCase: ignoreCase };
        }
        function peg$classExpectation(parts, inverted, ignoreCase) {
            return { type: "class", parts: parts, inverted: inverted, ignoreCase: ignoreCase };
        }
        function peg$anyExpectation() {
            return { type: "any" };
        }
        function peg$endExpectation() {
            return { type: "end" };
        }
        function peg$otherExpectation(description) {
            return { type: "other", description: description };
        }
        function peg$computePosDetails(pos) {
            var details = peg$posDetailsCache[pos];
            var p;
            if (details) {
                return details;
            }
            else {
                p = pos - 1;
                while (!peg$posDetailsCache[p]) {
                    p--;
                }
                details = peg$posDetailsCache[p];
                details = {
                    line: details.line,
                    column: details.column
                };
                while (p < pos) {
                    if (input.charCodeAt(p) === 10) {
                        details.line++;
                        details.column = 1;
                    }
                    else {
                        details.column++;
                    }
                    p++;
                }
                peg$posDetailsCache[pos] = details;
                return details;
            }
        }
        function peg$computeLocation(startPos, endPos) {
            var startPosDetails = peg$computePosDetails(startPos);
            var endPosDetails = peg$computePosDetails(endPos);
            return {
                start: {
                    offset: startPos,
                    line: startPosDetails.line,
                    column: startPosDetails.column
                },
                end: {
                    offset: endPos,
                    line: endPosDetails.line,
                    column: endPosDetails.column
                }
            };
        }
        function peg$fail(expected1) {
            if (peg$currPos < peg$maxFailPos) {
                return;
            }
            if (peg$currPos > peg$maxFailPos) {
                peg$maxFailPos = peg$currPos;
                peg$maxFailExpected = [];
            }
            peg$maxFailExpected.push(expected1);
        }
        function peg$buildSimpleError(message, location1) {
            return new SyntaxError(message, [], "", location1);
        }
        function peg$buildStructuredError(expected1, found, location1) {
            return new SyntaxError(SyntaxError.buildMessage(expected1, found), expected1, found, location1);
        }
        function peg$parsestart() {
            var s0;
            s0 = peg$parsemessage();
            return s0;
        }
        function peg$parsemessage() {
            var s0, s1;
            s0 = [];
            s1 = peg$parsemessageElement();
            while (s1 !== peg$FAILED) {
                s0.push(s1);
                s1 = peg$parsemessageElement();
            }
            return s0;
        }
        function peg$parsemessageElement() {
            var s0, s1, s2;
            s0 = peg$currPos;
            peg$savedPos = peg$currPos;
            s1 = peg$c0();
            if (s1) {
                s1 = undefined;
            }
            else {
                s1 = peg$FAILED;
            }
            if (s1 !== peg$FAILED) {
                s2 = peg$parsetagElement();
                if (s2 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s1 = peg$c1(s2);
                    s0 = s1;
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
            if (s0 === peg$FAILED) {
                s0 = peg$parseliteralElement();
                if (s0 === peg$FAILED) {
                    s0 = peg$parseargumentElement();
                    if (s0 === peg$FAILED) {
                        s0 = peg$parsesimpleFormatElement();
                        if (s0 === peg$FAILED) {
                            s0 = peg$parsepluralElement();
                            if (s0 === peg$FAILED) {
                                s0 = peg$parseselectElement();
                                if (s0 === peg$FAILED) {
                                    s0 = peg$parsepoundElement();
                                }
                            }
                        }
                    }
                }
            }
            return s0;
        }
        function peg$parsemessageText() {
            var s0, s1, s2, s3;
            s0 = peg$currPos;
            peg$savedPos = peg$currPos;
            s1 = peg$c2();
            if (s1) {
                s1 = undefined;
            }
            else {
                s1 = peg$FAILED;
            }
            if (s1 !== peg$FAILED) {
                s2 = [];
                s3 = peg$parsedoubleApostrophes();
                if (s3 === peg$FAILED) {
                    s3 = peg$parsequotedString();
                    if (s3 === peg$FAILED) {
                        s3 = peg$parseunquotedString();
                        if (s3 === peg$FAILED) {
                            if (input.charCodeAt(peg$currPos) === 60) {
                                s3 = peg$c3;
                                peg$currPos++;
                            }
                            else {
                                s3 = peg$FAILED;
                                if (peg$silentFails === 0) {
                                    peg$fail(peg$c4);
                                }
                            }
                        }
                    }
                }
                if (s3 !== peg$FAILED) {
                    while (s3 !== peg$FAILED) {
                        s2.push(s3);
                        s3 = peg$parsedoubleApostrophes();
                        if (s3 === peg$FAILED) {
                            s3 = peg$parsequotedString();
                            if (s3 === peg$FAILED) {
                                s3 = peg$parseunquotedString();
                                if (s3 === peg$FAILED) {
                                    if (input.charCodeAt(peg$currPos) === 60) {
                                        s3 = peg$c3;
                                        peg$currPos++;
                                    }
                                    else {
                                        s3 = peg$FAILED;
                                        if (peg$silentFails === 0) {
                                            peg$fail(peg$c4);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                else {
                    s2 = peg$FAILED;
                }
                if (s2 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s1 = peg$c5(s2);
                    s0 = s1;
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
            if (s0 === peg$FAILED) {
                s0 = peg$currPos;
                s1 = [];
                s2 = peg$parsedoubleApostrophes();
                if (s2 === peg$FAILED) {
                    s2 = peg$parsequotedString();
                    if (s2 === peg$FAILED) {
                        s2 = peg$parseunquotedString();
                        if (s2 === peg$FAILED) {
                            s2 = peg$parsenonTagStartingAngleBracket();
                        }
                    }
                }
                if (s2 !== peg$FAILED) {
                    while (s2 !== peg$FAILED) {
                        s1.push(s2);
                        s2 = peg$parsedoubleApostrophes();
                        if (s2 === peg$FAILED) {
                            s2 = peg$parsequotedString();
                            if (s2 === peg$FAILED) {
                                s2 = peg$parseunquotedString();
                                if (s2 === peg$FAILED) {
                                    s2 = peg$parsenonTagStartingAngleBracket();
                                }
                            }
                        }
                    }
                }
                else {
                    s1 = peg$FAILED;
                }
                if (s1 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s1 = peg$c5(s1);
                }
                s0 = s1;
            }
            return s0;
        }
        function peg$parsenonTagStartingAngleBracket() {
            var s0, s1, s2;
            s0 = peg$currPos;
            s1 = peg$currPos;
            peg$silentFails++;
            s2 = peg$parseopeningTag();
            if (s2 === peg$FAILED) {
                s2 = peg$parseclosingTag();
                if (s2 === peg$FAILED) {
                    s2 = peg$parseselfClosingTag();
                }
            }
            peg$silentFails--;
            if (s2 === peg$FAILED) {
                s1 = undefined;
            }
            else {
                peg$currPos = s1;
                s1 = peg$FAILED;
            }
            if (s1 !== peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 60) {
                    s2 = peg$c3;
                    peg$currPos++;
                }
                else {
                    s2 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$c4);
                    }
                }
                if (s2 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s1 = peg$c6();
                    s0 = s1;
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
            return s0;
        }
        function peg$parseliteralElement() {
            var s0, s1;
            s0 = peg$currPos;
            s1 = peg$parsemessageText();
            if (s1 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c7(s1);
            }
            s0 = s1;
            return s0;
        }
        function peg$parsepoundElement() {
            var s0, s1;
            s0 = peg$currPos;
            if (input.charCodeAt(peg$currPos) === 35) {
                s1 = peg$c8;
                peg$currPos++;
            }
            else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c9);
                }
            }
            if (s1 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c10();
            }
            s0 = s1;
            return s0;
        }
        function peg$parsetagElement() {
            var s0, s1, s2, s3;
            peg$silentFails++;
            s0 = peg$parseselfClosingTag();
            if (s0 === peg$FAILED) {
                s0 = peg$currPos;
                s1 = peg$parseopeningTag();
                if (s1 !== peg$FAILED) {
                    s2 = peg$parsemessage();
                    if (s2 !== peg$FAILED) {
                        s3 = peg$parseclosingTag();
                        if (s3 !== peg$FAILED) {
                            peg$savedPos = s0;
                            s1 = peg$c12(s1, s2, s3);
                            s0 = s1;
                        }
                        else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            peg$silentFails--;
            if (s0 === peg$FAILED) {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c11);
                }
            }
            return s0;
        }
        function peg$parseselfClosingTag() {
            var s0, s1, s2, s3, s4, s5;
            s0 = peg$currPos;
            s1 = peg$currPos;
            if (input.charCodeAt(peg$currPos) === 60) {
                s2 = peg$c3;
                peg$currPos++;
            }
            else {
                s2 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c4);
                }
            }
            if (s2 !== peg$FAILED) {
                s3 = peg$parsevalidTag();
                if (s3 !== peg$FAILED) {
                    s4 = peg$parse_();
                    if (s4 !== peg$FAILED) {
                        if (input.substr(peg$currPos, 2) === peg$c13) {
                            s5 = peg$c13;
                            peg$currPos += 2;
                        }
                        else {
                            s5 = peg$FAILED;
                            if (peg$silentFails === 0) {
                                peg$fail(peg$c14);
                            }
                        }
                        if (s5 !== peg$FAILED) {
                            s2 = [s2, s3, s4, s5];
                            s1 = s2;
                        }
                        else {
                            peg$currPos = s1;
                            s1 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s1;
                        s1 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s1;
                    s1 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s1;
                s1 = peg$FAILED;
            }
            if (s1 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c15(s1);
            }
            s0 = s1;
            return s0;
        }
        function peg$parseopeningTag() {
            var s0, s1, s2, s3;
            s0 = peg$currPos;
            if (input.charCodeAt(peg$currPos) === 60) {
                s1 = peg$c3;
                peg$currPos++;
            }
            else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c4);
                }
            }
            if (s1 !== peg$FAILED) {
                s2 = peg$parsevalidTag();
                if (s2 !== peg$FAILED) {
                    if (input.charCodeAt(peg$currPos) === 62) {
                        s3 = peg$c16;
                        peg$currPos++;
                    }
                    else {
                        s3 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$c17);
                        }
                    }
                    if (s3 !== peg$FAILED) {
                        peg$savedPos = s0;
                        s1 = peg$c18(s2);
                        s0 = s1;
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
            return s0;
        }
        function peg$parseclosingTag() {
            var s0, s1, s2, s3;
            s0 = peg$currPos;
            if (input.substr(peg$currPos, 2) === peg$c19) {
                s1 = peg$c19;
                peg$currPos += 2;
            }
            else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c20);
                }
            }
            if (s1 !== peg$FAILED) {
                s2 = peg$parsevalidTag();
                if (s2 !== peg$FAILED) {
                    if (input.charCodeAt(peg$currPos) === 62) {
                        s3 = peg$c16;
                        peg$currPos++;
                    }
                    else {
                        s3 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$c17);
                        }
                    }
                    if (s3 !== peg$FAILED) {
                        peg$savedPos = s0;
                        s1 = peg$c18(s2);
                        s0 = s1;
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
            return s0;
        }
        function peg$parseargumentElement() {
            var s0, s1, s2, s3, s4, s5;
            peg$silentFails++;
            s0 = peg$currPos;
            if (input.charCodeAt(peg$currPos) === 123) {
                s1 = peg$c22;
                peg$currPos++;
            }
            else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c23);
                }
            }
            if (s1 !== peg$FAILED) {
                s2 = peg$parse_();
                if (s2 !== peg$FAILED) {
                    s3 = peg$parseargNameOrNumber();
                    if (s3 !== peg$FAILED) {
                        s4 = peg$parse_();
                        if (s4 !== peg$FAILED) {
                            if (input.charCodeAt(peg$currPos) === 125) {
                                s5 = peg$c24;
                                peg$currPos++;
                            }
                            else {
                                s5 = peg$FAILED;
                                if (peg$silentFails === 0) {
                                    peg$fail(peg$c25);
                                }
                            }
                            if (s5 !== peg$FAILED) {
                                peg$savedPos = s0;
                                s1 = peg$c26(s3);
                                s0 = s1;
                            }
                            else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                            }
                        }
                        else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
            peg$silentFails--;
            if (s0 === peg$FAILED) {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c21);
                }
            }
            return s0;
        }
        function peg$parsenumberSkeletonId() {
            var s0, s1, s2, s3, s4;
            peg$silentFails++;
            s0 = peg$currPos;
            s1 = [];
            s2 = peg$currPos;
            s3 = peg$currPos;
            peg$silentFails++;
            s4 = peg$parsewhiteSpace();
            if (s4 === peg$FAILED) {
                if (peg$c28.test(input.charAt(peg$currPos))) {
                    s4 = input.charAt(peg$currPos);
                    peg$currPos++;
                }
                else {
                    s4 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$c29);
                    }
                }
            }
            peg$silentFails--;
            if (s4 === peg$FAILED) {
                s3 = undefined;
            }
            else {
                peg$currPos = s3;
                s3 = peg$FAILED;
            }
            if (s3 !== peg$FAILED) {
                if (input.length > peg$currPos) {
                    s4 = input.charAt(peg$currPos);
                    peg$currPos++;
                }
                else {
                    s4 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$c30);
                    }
                }
                if (s4 !== peg$FAILED) {
                    s3 = [s3, s4];
                    s2 = s3;
                }
                else {
                    peg$currPos = s2;
                    s2 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s2;
                s2 = peg$FAILED;
            }
            if (s2 !== peg$FAILED) {
                while (s2 !== peg$FAILED) {
                    s1.push(s2);
                    s2 = peg$currPos;
                    s3 = peg$currPos;
                    peg$silentFails++;
                    s4 = peg$parsewhiteSpace();
                    if (s4 === peg$FAILED) {
                        if (peg$c28.test(input.charAt(peg$currPos))) {
                            s4 = input.charAt(peg$currPos);
                            peg$currPos++;
                        }
                        else {
                            s4 = peg$FAILED;
                            if (peg$silentFails === 0) {
                                peg$fail(peg$c29);
                            }
                        }
                    }
                    peg$silentFails--;
                    if (s4 === peg$FAILED) {
                        s3 = undefined;
                    }
                    else {
                        peg$currPos = s3;
                        s3 = peg$FAILED;
                    }
                    if (s3 !== peg$FAILED) {
                        if (input.length > peg$currPos) {
                            s4 = input.charAt(peg$currPos);
                            peg$currPos++;
                        }
                        else {
                            s4 = peg$FAILED;
                            if (peg$silentFails === 0) {
                                peg$fail(peg$c30);
                            }
                        }
                        if (s4 !== peg$FAILED) {
                            s3 = [s3, s4];
                            s2 = s3;
                        }
                        else {
                            peg$currPos = s2;
                            s2 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s2;
                        s2 = peg$FAILED;
                    }
                }
            }
            else {
                s1 = peg$FAILED;
            }
            if (s1 !== peg$FAILED) {
                s0 = input.substring(s0, peg$currPos);
            }
            else {
                s0 = s1;
            }
            peg$silentFails--;
            if (s0 === peg$FAILED) {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c27);
                }
            }
            return s0;
        }
        function peg$parsenumberSkeletonTokenOption() {
            var s0, s1, s2;
            peg$silentFails++;
            s0 = peg$currPos;
            if (input.charCodeAt(peg$currPos) === 47) {
                s1 = peg$c32;
                peg$currPos++;
            }
            else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c33);
                }
            }
            if (s1 !== peg$FAILED) {
                s2 = peg$parsenumberSkeletonId();
                if (s2 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s1 = peg$c34(s2);
                    s0 = s1;
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
            peg$silentFails--;
            if (s0 === peg$FAILED) {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c31);
                }
            }
            return s0;
        }
        function peg$parsenumberSkeletonToken() {
            var s0, s1, s2, s3, s4;
            peg$silentFails++;
            s0 = peg$currPos;
            s1 = peg$parse_();
            if (s1 !== peg$FAILED) {
                s2 = peg$parsenumberSkeletonId();
                if (s2 !== peg$FAILED) {
                    s3 = [];
                    s4 = peg$parsenumberSkeletonTokenOption();
                    while (s4 !== peg$FAILED) {
                        s3.push(s4);
                        s4 = peg$parsenumberSkeletonTokenOption();
                    }
                    if (s3 !== peg$FAILED) {
                        peg$savedPos = s0;
                        s1 = peg$c36(s2, s3);
                        s0 = s1;
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
            peg$silentFails--;
            if (s0 === peg$FAILED) {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c35);
                }
            }
            return s0;
        }
        function peg$parsenumberSkeleton() {
            var s0, s1, s2;
            s0 = peg$currPos;
            s1 = [];
            s2 = peg$parsenumberSkeletonToken();
            if (s2 !== peg$FAILED) {
                while (s2 !== peg$FAILED) {
                    s1.push(s2);
                    s2 = peg$parsenumberSkeletonToken();
                }
            }
            else {
                s1 = peg$FAILED;
            }
            if (s1 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c37(s1);
            }
            s0 = s1;
            return s0;
        }
        function peg$parsenumberArgStyle() {
            var s0, s1, s2;
            s0 = peg$currPos;
            if (input.substr(peg$currPos, 2) === peg$c38) {
                s1 = peg$c38;
                peg$currPos += 2;
            }
            else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c39);
                }
            }
            if (s1 !== peg$FAILED) {
                s2 = peg$parsenumberSkeleton();
                if (s2 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s1 = peg$c40(s2);
                    s0 = s1;
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
            if (s0 === peg$FAILED) {
                s0 = peg$currPos;
                peg$savedPos = peg$currPos;
                s1 = peg$c41();
                if (s1) {
                    s1 = undefined;
                }
                else {
                    s1 = peg$FAILED;
                }
                if (s1 !== peg$FAILED) {
                    s2 = peg$parsemessageText();
                    if (s2 !== peg$FAILED) {
                        peg$savedPos = s0;
                        s1 = peg$c42(s2);
                        s0 = s1;
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            return s0;
        }
        function peg$parsenumberFormatElement() {
            var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12;
            s0 = peg$currPos;
            if (input.charCodeAt(peg$currPos) === 123) {
                s1 = peg$c22;
                peg$currPos++;
            }
            else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c23);
                }
            }
            if (s1 !== peg$FAILED) {
                s2 = peg$parse_();
                if (s2 !== peg$FAILED) {
                    s3 = peg$parseargNameOrNumber();
                    if (s3 !== peg$FAILED) {
                        s4 = peg$parse_();
                        if (s4 !== peg$FAILED) {
                            if (input.charCodeAt(peg$currPos) === 44) {
                                s5 = peg$c43;
                                peg$currPos++;
                            }
                            else {
                                s5 = peg$FAILED;
                                if (peg$silentFails === 0) {
                                    peg$fail(peg$c44);
                                }
                            }
                            if (s5 !== peg$FAILED) {
                                s6 = peg$parse_();
                                if (s6 !== peg$FAILED) {
                                    if (input.substr(peg$currPos, 6) === peg$c45) {
                                        s7 = peg$c45;
                                        peg$currPos += 6;
                                    }
                                    else {
                                        s7 = peg$FAILED;
                                        if (peg$silentFails === 0) {
                                            peg$fail(peg$c46);
                                        }
                                    }
                                    if (s7 !== peg$FAILED) {
                                        s8 = peg$parse_();
                                        if (s8 !== peg$FAILED) {
                                            s9 = peg$currPos;
                                            if (input.charCodeAt(peg$currPos) === 44) {
                                                s10 = peg$c43;
                                                peg$currPos++;
                                            }
                                            else {
                                                s10 = peg$FAILED;
                                                if (peg$silentFails === 0) {
                                                    peg$fail(peg$c44);
                                                }
                                            }
                                            if (s10 !== peg$FAILED) {
                                                s11 = peg$parse_();
                                                if (s11 !== peg$FAILED) {
                                                    s12 = peg$parsenumberArgStyle();
                                                    if (s12 !== peg$FAILED) {
                                                        s10 = [s10, s11, s12];
                                                        s9 = s10;
                                                    }
                                                    else {
                                                        peg$currPos = s9;
                                                        s9 = peg$FAILED;
                                                    }
                                                }
                                                else {
                                                    peg$currPos = s9;
                                                    s9 = peg$FAILED;
                                                }
                                            }
                                            else {
                                                peg$currPos = s9;
                                                s9 = peg$FAILED;
                                            }
                                            if (s9 === peg$FAILED) {
                                                s9 = null;
                                            }
                                            if (s9 !== peg$FAILED) {
                                                s10 = peg$parse_();
                                                if (s10 !== peg$FAILED) {
                                                    if (input.charCodeAt(peg$currPos) === 125) {
                                                        s11 = peg$c24;
                                                        peg$currPos++;
                                                    }
                                                    else {
                                                        s11 = peg$FAILED;
                                                        if (peg$silentFails === 0) {
                                                            peg$fail(peg$c25);
                                                        }
                                                    }
                                                    if (s11 !== peg$FAILED) {
                                                        peg$savedPos = s0;
                                                        s1 = peg$c47(s3, s7, s9);
                                                        s0 = s1;
                                                    }
                                                    else {
                                                        peg$currPos = s0;
                                                        s0 = peg$FAILED;
                                                    }
                                                }
                                                else {
                                                    peg$currPos = s0;
                                                    s0 = peg$FAILED;
                                                }
                                            }
                                            else {
                                                peg$currPos = s0;
                                                s0 = peg$FAILED;
                                            }
                                        }
                                        else {
                                            peg$currPos = s0;
                                            s0 = peg$FAILED;
                                        }
                                    }
                                    else {
                                        peg$currPos = s0;
                                        s0 = peg$FAILED;
                                    }
                                }
                                else {
                                    peg$currPos = s0;
                                    s0 = peg$FAILED;
                                }
                            }
                            else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                            }
                        }
                        else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
            return s0;
        }
        function peg$parsedateTimeSkeletonLiteral() {
            var s0, s1, s2, s3;
            s0 = peg$currPos;
            if (input.charCodeAt(peg$currPos) === 39) {
                s1 = peg$c48;
                peg$currPos++;
            }
            else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c49);
                }
            }
            if (s1 !== peg$FAILED) {
                s2 = [];
                s3 = peg$parsedoubleApostrophes();
                if (s3 === peg$FAILED) {
                    if (peg$c50.test(input.charAt(peg$currPos))) {
                        s3 = input.charAt(peg$currPos);
                        peg$currPos++;
                    }
                    else {
                        s3 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$c51);
                        }
                    }
                }
                if (s3 !== peg$FAILED) {
                    while (s3 !== peg$FAILED) {
                        s2.push(s3);
                        s3 = peg$parsedoubleApostrophes();
                        if (s3 === peg$FAILED) {
                            if (peg$c50.test(input.charAt(peg$currPos))) {
                                s3 = input.charAt(peg$currPos);
                                peg$currPos++;
                            }
                            else {
                                s3 = peg$FAILED;
                                if (peg$silentFails === 0) {
                                    peg$fail(peg$c51);
                                }
                            }
                        }
                    }
                }
                else {
                    s2 = peg$FAILED;
                }
                if (s2 !== peg$FAILED) {
                    if (input.charCodeAt(peg$currPos) === 39) {
                        s3 = peg$c48;
                        peg$currPos++;
                    }
                    else {
                        s3 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$c49);
                        }
                    }
                    if (s3 !== peg$FAILED) {
                        s1 = [s1, s2, s3];
                        s0 = s1;
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
            if (s0 === peg$FAILED) {
                s0 = [];
                s1 = peg$parsedoubleApostrophes();
                if (s1 === peg$FAILED) {
                    if (peg$c52.test(input.charAt(peg$currPos))) {
                        s1 = input.charAt(peg$currPos);
                        peg$currPos++;
                    }
                    else {
                        s1 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$c53);
                        }
                    }
                }
                if (s1 !== peg$FAILED) {
                    while (s1 !== peg$FAILED) {
                        s0.push(s1);
                        s1 = peg$parsedoubleApostrophes();
                        if (s1 === peg$FAILED) {
                            if (peg$c52.test(input.charAt(peg$currPos))) {
                                s1 = input.charAt(peg$currPos);
                                peg$currPos++;
                            }
                            else {
                                s1 = peg$FAILED;
                                if (peg$silentFails === 0) {
                                    peg$fail(peg$c53);
                                }
                            }
                        }
                    }
                }
                else {
                    s0 = peg$FAILED;
                }
            }
            return s0;
        }
        function peg$parsedateTimeSkeletonPattern() {
            var s0, s1;
            s0 = [];
            if (peg$c54.test(input.charAt(peg$currPos))) {
                s1 = input.charAt(peg$currPos);
                peg$currPos++;
            }
            else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c55);
                }
            }
            if (s1 !== peg$FAILED) {
                while (s1 !== peg$FAILED) {
                    s0.push(s1);
                    if (peg$c54.test(input.charAt(peg$currPos))) {
                        s1 = input.charAt(peg$currPos);
                        peg$currPos++;
                    }
                    else {
                        s1 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$c55);
                        }
                    }
                }
            }
            else {
                s0 = peg$FAILED;
            }
            return s0;
        }
        function peg$parsedateTimeSkeleton() {
            var s0, s1, s2, s3;
            s0 = peg$currPos;
            s1 = peg$currPos;
            s2 = [];
            s3 = peg$parsedateTimeSkeletonLiteral();
            if (s3 === peg$FAILED) {
                s3 = peg$parsedateTimeSkeletonPattern();
            }
            if (s3 !== peg$FAILED) {
                while (s3 !== peg$FAILED) {
                    s2.push(s3);
                    s3 = peg$parsedateTimeSkeletonLiteral();
                    if (s3 === peg$FAILED) {
                        s3 = peg$parsedateTimeSkeletonPattern();
                    }
                }
            }
            else {
                s2 = peg$FAILED;
            }
            if (s2 !== peg$FAILED) {
                s1 = input.substring(s1, peg$currPos);
            }
            else {
                s1 = s2;
            }
            if (s1 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c56(s1);
            }
            s0 = s1;
            return s0;
        }
        function peg$parsedateOrTimeArgStyle() {
            var s0, s1, s2;
            s0 = peg$currPos;
            if (input.substr(peg$currPos, 2) === peg$c38) {
                s1 = peg$c38;
                peg$currPos += 2;
            }
            else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c39);
                }
            }
            if (s1 !== peg$FAILED) {
                s2 = peg$parsedateTimeSkeleton();
                if (s2 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s1 = peg$c40(s2);
                    s0 = s1;
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
            if (s0 === peg$FAILED) {
                s0 = peg$currPos;
                peg$savedPos = peg$currPos;
                s1 = peg$c57();
                if (s1) {
                    s1 = undefined;
                }
                else {
                    s1 = peg$FAILED;
                }
                if (s1 !== peg$FAILED) {
                    s2 = peg$parsemessageText();
                    if (s2 !== peg$FAILED) {
                        peg$savedPos = s0;
                        s1 = peg$c42(s2);
                        s0 = s1;
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            return s0;
        }
        function peg$parsedateOrTimeFormatElement() {
            var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12;
            s0 = peg$currPos;
            if (input.charCodeAt(peg$currPos) === 123) {
                s1 = peg$c22;
                peg$currPos++;
            }
            else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c23);
                }
            }
            if (s1 !== peg$FAILED) {
                s2 = peg$parse_();
                if (s2 !== peg$FAILED) {
                    s3 = peg$parseargNameOrNumber();
                    if (s3 !== peg$FAILED) {
                        s4 = peg$parse_();
                        if (s4 !== peg$FAILED) {
                            if (input.charCodeAt(peg$currPos) === 44) {
                                s5 = peg$c43;
                                peg$currPos++;
                            }
                            else {
                                s5 = peg$FAILED;
                                if (peg$silentFails === 0) {
                                    peg$fail(peg$c44);
                                }
                            }
                            if (s5 !== peg$FAILED) {
                                s6 = peg$parse_();
                                if (s6 !== peg$FAILED) {
                                    if (input.substr(peg$currPos, 4) === peg$c58) {
                                        s7 = peg$c58;
                                        peg$currPos += 4;
                                    }
                                    else {
                                        s7 = peg$FAILED;
                                        if (peg$silentFails === 0) {
                                            peg$fail(peg$c59);
                                        }
                                    }
                                    if (s7 === peg$FAILED) {
                                        if (input.substr(peg$currPos, 4) === peg$c60) {
                                            s7 = peg$c60;
                                            peg$currPos += 4;
                                        }
                                        else {
                                            s7 = peg$FAILED;
                                            if (peg$silentFails === 0) {
                                                peg$fail(peg$c61);
                                            }
                                        }
                                    }
                                    if (s7 !== peg$FAILED) {
                                        s8 = peg$parse_();
                                        if (s8 !== peg$FAILED) {
                                            s9 = peg$currPos;
                                            if (input.charCodeAt(peg$currPos) === 44) {
                                                s10 = peg$c43;
                                                peg$currPos++;
                                            }
                                            else {
                                                s10 = peg$FAILED;
                                                if (peg$silentFails === 0) {
                                                    peg$fail(peg$c44);
                                                }
                                            }
                                            if (s10 !== peg$FAILED) {
                                                s11 = peg$parse_();
                                                if (s11 !== peg$FAILED) {
                                                    s12 = peg$parsedateOrTimeArgStyle();
                                                    if (s12 !== peg$FAILED) {
                                                        s10 = [s10, s11, s12];
                                                        s9 = s10;
                                                    }
                                                    else {
                                                        peg$currPos = s9;
                                                        s9 = peg$FAILED;
                                                    }
                                                }
                                                else {
                                                    peg$currPos = s9;
                                                    s9 = peg$FAILED;
                                                }
                                            }
                                            else {
                                                peg$currPos = s9;
                                                s9 = peg$FAILED;
                                            }
                                            if (s9 === peg$FAILED) {
                                                s9 = null;
                                            }
                                            if (s9 !== peg$FAILED) {
                                                s10 = peg$parse_();
                                                if (s10 !== peg$FAILED) {
                                                    if (input.charCodeAt(peg$currPos) === 125) {
                                                        s11 = peg$c24;
                                                        peg$currPos++;
                                                    }
                                                    else {
                                                        s11 = peg$FAILED;
                                                        if (peg$silentFails === 0) {
                                                            peg$fail(peg$c25);
                                                        }
                                                    }
                                                    if (s11 !== peg$FAILED) {
                                                        peg$savedPos = s0;
                                                        s1 = peg$c47(s3, s7, s9);
                                                        s0 = s1;
                                                    }
                                                    else {
                                                        peg$currPos = s0;
                                                        s0 = peg$FAILED;
                                                    }
                                                }
                                                else {
                                                    peg$currPos = s0;
                                                    s0 = peg$FAILED;
                                                }
                                            }
                                            else {
                                                peg$currPos = s0;
                                                s0 = peg$FAILED;
                                            }
                                        }
                                        else {
                                            peg$currPos = s0;
                                            s0 = peg$FAILED;
                                        }
                                    }
                                    else {
                                        peg$currPos = s0;
                                        s0 = peg$FAILED;
                                    }
                                }
                                else {
                                    peg$currPos = s0;
                                    s0 = peg$FAILED;
                                }
                            }
                            else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                            }
                        }
                        else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
            return s0;
        }
        function peg$parsesimpleFormatElement() {
            var s0;
            s0 = peg$parsenumberFormatElement();
            if (s0 === peg$FAILED) {
                s0 = peg$parsedateOrTimeFormatElement();
            }
            return s0;
        }
        function peg$parsepluralElement() {
            var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12, s13, s14, s15;
            s0 = peg$currPos;
            if (input.charCodeAt(peg$currPos) === 123) {
                s1 = peg$c22;
                peg$currPos++;
            }
            else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c23);
                }
            }
            if (s1 !== peg$FAILED) {
                s2 = peg$parse_();
                if (s2 !== peg$FAILED) {
                    s3 = peg$parseargNameOrNumber();
                    if (s3 !== peg$FAILED) {
                        s4 = peg$parse_();
                        if (s4 !== peg$FAILED) {
                            if (input.charCodeAt(peg$currPos) === 44) {
                                s5 = peg$c43;
                                peg$currPos++;
                            }
                            else {
                                s5 = peg$FAILED;
                                if (peg$silentFails === 0) {
                                    peg$fail(peg$c44);
                                }
                            }
                            if (s5 !== peg$FAILED) {
                                s6 = peg$parse_();
                                if (s6 !== peg$FAILED) {
                                    if (input.substr(peg$currPos, 6) === peg$c62) {
                                        s7 = peg$c62;
                                        peg$currPos += 6;
                                    }
                                    else {
                                        s7 = peg$FAILED;
                                        if (peg$silentFails === 0) {
                                            peg$fail(peg$c63);
                                        }
                                    }
                                    if (s7 === peg$FAILED) {
                                        if (input.substr(peg$currPos, 13) === peg$c64) {
                                            s7 = peg$c64;
                                            peg$currPos += 13;
                                        }
                                        else {
                                            s7 = peg$FAILED;
                                            if (peg$silentFails === 0) {
                                                peg$fail(peg$c65);
                                            }
                                        }
                                    }
                                    if (s7 !== peg$FAILED) {
                                        s8 = peg$parse_();
                                        if (s8 !== peg$FAILED) {
                                            if (input.charCodeAt(peg$currPos) === 44) {
                                                s9 = peg$c43;
                                                peg$currPos++;
                                            }
                                            else {
                                                s9 = peg$FAILED;
                                                if (peg$silentFails === 0) {
                                                    peg$fail(peg$c44);
                                                }
                                            }
                                            if (s9 !== peg$FAILED) {
                                                s10 = peg$parse_();
                                                if (s10 !== peg$FAILED) {
                                                    s11 = peg$currPos;
                                                    if (input.substr(peg$currPos, 7) === peg$c66) {
                                                        s12 = peg$c66;
                                                        peg$currPos += 7;
                                                    }
                                                    else {
                                                        s12 = peg$FAILED;
                                                        if (peg$silentFails === 0) {
                                                            peg$fail(peg$c67);
                                                        }
                                                    }
                                                    if (s12 !== peg$FAILED) {
                                                        s13 = peg$parse_();
                                                        if (s13 !== peg$FAILED) {
                                                            s14 = peg$parsenumber();
                                                            if (s14 !== peg$FAILED) {
                                                                s12 = [s12, s13, s14];
                                                                s11 = s12;
                                                            }
                                                            else {
                                                                peg$currPos = s11;
                                                                s11 = peg$FAILED;
                                                            }
                                                        }
                                                        else {
                                                            peg$currPos = s11;
                                                            s11 = peg$FAILED;
                                                        }
                                                    }
                                                    else {
                                                        peg$currPos = s11;
                                                        s11 = peg$FAILED;
                                                    }
                                                    if (s11 === peg$FAILED) {
                                                        s11 = null;
                                                    }
                                                    if (s11 !== peg$FAILED) {
                                                        s12 = peg$parse_();
                                                        if (s12 !== peg$FAILED) {
                                                            s13 = [];
                                                            s14 = peg$parsepluralOption();
                                                            if (s14 !== peg$FAILED) {
                                                                while (s14 !== peg$FAILED) {
                                                                    s13.push(s14);
                                                                    s14 = peg$parsepluralOption();
                                                                }
                                                            }
                                                            else {
                                                                s13 = peg$FAILED;
                                                            }
                                                            if (s13 !== peg$FAILED) {
                                                                s14 = peg$parse_();
                                                                if (s14 !== peg$FAILED) {
                                                                    if (input.charCodeAt(peg$currPos) === 125) {
                                                                        s15 = peg$c24;
                                                                        peg$currPos++;
                                                                    }
                                                                    else {
                                                                        s15 = peg$FAILED;
                                                                        if (peg$silentFails === 0) {
                                                                            peg$fail(peg$c25);
                                                                        }
                                                                    }
                                                                    if (s15 !== peg$FAILED) {
                                                                        peg$savedPos = s0;
                                                                        s1 = peg$c68(s3, s7, s11, s13);
                                                                        s0 = s1;
                                                                    }
                                                                    else {
                                                                        peg$currPos = s0;
                                                                        s0 = peg$FAILED;
                                                                    }
                                                                }
                                                                else {
                                                                    peg$currPos = s0;
                                                                    s0 = peg$FAILED;
                                                                }
                                                            }
                                                            else {
                                                                peg$currPos = s0;
                                                                s0 = peg$FAILED;
                                                            }
                                                        }
                                                        else {
                                                            peg$currPos = s0;
                                                            s0 = peg$FAILED;
                                                        }
                                                    }
                                                    else {
                                                        peg$currPos = s0;
                                                        s0 = peg$FAILED;
                                                    }
                                                }
                                                else {
                                                    peg$currPos = s0;
                                                    s0 = peg$FAILED;
                                                }
                                            }
                                            else {
                                                peg$currPos = s0;
                                                s0 = peg$FAILED;
                                            }
                                        }
                                        else {
                                            peg$currPos = s0;
                                            s0 = peg$FAILED;
                                        }
                                    }
                                    else {
                                        peg$currPos = s0;
                                        s0 = peg$FAILED;
                                    }
                                }
                                else {
                                    peg$currPos = s0;
                                    s0 = peg$FAILED;
                                }
                            }
                            else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                            }
                        }
                        else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
            return s0;
        }
        function peg$parseselectElement() {
            var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9, s10, s11, s12, s13;
            s0 = peg$currPos;
            if (input.charCodeAt(peg$currPos) === 123) {
                s1 = peg$c22;
                peg$currPos++;
            }
            else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c23);
                }
            }
            if (s1 !== peg$FAILED) {
                s2 = peg$parse_();
                if (s2 !== peg$FAILED) {
                    s3 = peg$parseargNameOrNumber();
                    if (s3 !== peg$FAILED) {
                        s4 = peg$parse_();
                        if (s4 !== peg$FAILED) {
                            if (input.charCodeAt(peg$currPos) === 44) {
                                s5 = peg$c43;
                                peg$currPos++;
                            }
                            else {
                                s5 = peg$FAILED;
                                if (peg$silentFails === 0) {
                                    peg$fail(peg$c44);
                                }
                            }
                            if (s5 !== peg$FAILED) {
                                s6 = peg$parse_();
                                if (s6 !== peg$FAILED) {
                                    if (input.substr(peg$currPos, 6) === peg$c69) {
                                        s7 = peg$c69;
                                        peg$currPos += 6;
                                    }
                                    else {
                                        s7 = peg$FAILED;
                                        if (peg$silentFails === 0) {
                                            peg$fail(peg$c70);
                                        }
                                    }
                                    if (s7 !== peg$FAILED) {
                                        s8 = peg$parse_();
                                        if (s8 !== peg$FAILED) {
                                            if (input.charCodeAt(peg$currPos) === 44) {
                                                s9 = peg$c43;
                                                peg$currPos++;
                                            }
                                            else {
                                                s9 = peg$FAILED;
                                                if (peg$silentFails === 0) {
                                                    peg$fail(peg$c44);
                                                }
                                            }
                                            if (s9 !== peg$FAILED) {
                                                s10 = peg$parse_();
                                                if (s10 !== peg$FAILED) {
                                                    s11 = [];
                                                    s12 = peg$parseselectOption();
                                                    if (s12 !== peg$FAILED) {
                                                        while (s12 !== peg$FAILED) {
                                                            s11.push(s12);
                                                            s12 = peg$parseselectOption();
                                                        }
                                                    }
                                                    else {
                                                        s11 = peg$FAILED;
                                                    }
                                                    if (s11 !== peg$FAILED) {
                                                        s12 = peg$parse_();
                                                        if (s12 !== peg$FAILED) {
                                                            if (input.charCodeAt(peg$currPos) === 125) {
                                                                s13 = peg$c24;
                                                                peg$currPos++;
                                                            }
                                                            else {
                                                                s13 = peg$FAILED;
                                                                if (peg$silentFails === 0) {
                                                                    peg$fail(peg$c25);
                                                                }
                                                            }
                                                            if (s13 !== peg$FAILED) {
                                                                peg$savedPos = s0;
                                                                s1 = peg$c71(s3, s11);
                                                                s0 = s1;
                                                            }
                                                            else {
                                                                peg$currPos = s0;
                                                                s0 = peg$FAILED;
                                                            }
                                                        }
                                                        else {
                                                            peg$currPos = s0;
                                                            s0 = peg$FAILED;
                                                        }
                                                    }
                                                    else {
                                                        peg$currPos = s0;
                                                        s0 = peg$FAILED;
                                                    }
                                                }
                                                else {
                                                    peg$currPos = s0;
                                                    s0 = peg$FAILED;
                                                }
                                            }
                                            else {
                                                peg$currPos = s0;
                                                s0 = peg$FAILED;
                                            }
                                        }
                                        else {
                                            peg$currPos = s0;
                                            s0 = peg$FAILED;
                                        }
                                    }
                                    else {
                                        peg$currPos = s0;
                                        s0 = peg$FAILED;
                                    }
                                }
                                else {
                                    peg$currPos = s0;
                                    s0 = peg$FAILED;
                                }
                            }
                            else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                            }
                        }
                        else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
            return s0;
        }
        function peg$parsepluralRuleSelectValue() {
            var s0, s1, s2, s3;
            s0 = peg$currPos;
            s1 = peg$currPos;
            if (input.charCodeAt(peg$currPos) === 61) {
                s2 = peg$c72;
                peg$currPos++;
            }
            else {
                s2 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c73);
                }
            }
            if (s2 !== peg$FAILED) {
                s3 = peg$parsenumber();
                if (s3 !== peg$FAILED) {
                    s2 = [s2, s3];
                    s1 = s2;
                }
                else {
                    peg$currPos = s1;
                    s1 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s1;
                s1 = peg$FAILED;
            }
            if (s1 !== peg$FAILED) {
                s0 = input.substring(s0, peg$currPos);
            }
            else {
                s0 = s1;
            }
            if (s0 === peg$FAILED) {
                s0 = peg$parseargName();
            }
            return s0;
        }
        function peg$parseselectOption() {
            var s0, s1, s2, s3, s4, s5, s6, s7;
            s0 = peg$currPos;
            s1 = peg$parse_();
            if (s1 !== peg$FAILED) {
                s2 = peg$parseargName();
                if (s2 !== peg$FAILED) {
                    s3 = peg$parse_();
                    if (s3 !== peg$FAILED) {
                        if (input.charCodeAt(peg$currPos) === 123) {
                            s4 = peg$c22;
                            peg$currPos++;
                        }
                        else {
                            s4 = peg$FAILED;
                            if (peg$silentFails === 0) {
                                peg$fail(peg$c23);
                            }
                        }
                        if (s4 !== peg$FAILED) {
                            peg$savedPos = peg$currPos;
                            s5 = peg$c74();
                            if (s5) {
                                s5 = undefined;
                            }
                            else {
                                s5 = peg$FAILED;
                            }
                            if (s5 !== peg$FAILED) {
                                s6 = peg$parsemessage();
                                if (s6 !== peg$FAILED) {
                                    if (input.charCodeAt(peg$currPos) === 125) {
                                        s7 = peg$c24;
                                        peg$currPos++;
                                    }
                                    else {
                                        s7 = peg$FAILED;
                                        if (peg$silentFails === 0) {
                                            peg$fail(peg$c25);
                                        }
                                    }
                                    if (s7 !== peg$FAILED) {
                                        peg$savedPos = s0;
                                        s1 = peg$c75(s2, s6);
                                        s0 = s1;
                                    }
                                    else {
                                        peg$currPos = s0;
                                        s0 = peg$FAILED;
                                    }
                                }
                                else {
                                    peg$currPos = s0;
                                    s0 = peg$FAILED;
                                }
                            }
                            else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                            }
                        }
                        else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
            return s0;
        }
        function peg$parsepluralOption() {
            var s0, s1, s2, s3, s4, s5, s6, s7;
            s0 = peg$currPos;
            s1 = peg$parse_();
            if (s1 !== peg$FAILED) {
                s2 = peg$parsepluralRuleSelectValue();
                if (s2 !== peg$FAILED) {
                    s3 = peg$parse_();
                    if (s3 !== peg$FAILED) {
                        if (input.charCodeAt(peg$currPos) === 123) {
                            s4 = peg$c22;
                            peg$currPos++;
                        }
                        else {
                            s4 = peg$FAILED;
                            if (peg$silentFails === 0) {
                                peg$fail(peg$c23);
                            }
                        }
                        if (s4 !== peg$FAILED) {
                            peg$savedPos = peg$currPos;
                            s5 = peg$c76();
                            if (s5) {
                                s5 = undefined;
                            }
                            else {
                                s5 = peg$FAILED;
                            }
                            if (s5 !== peg$FAILED) {
                                s6 = peg$parsemessage();
                                if (s6 !== peg$FAILED) {
                                    if (input.charCodeAt(peg$currPos) === 125) {
                                        s7 = peg$c24;
                                        peg$currPos++;
                                    }
                                    else {
                                        s7 = peg$FAILED;
                                        if (peg$silentFails === 0) {
                                            peg$fail(peg$c25);
                                        }
                                    }
                                    if (s7 !== peg$FAILED) {
                                        peg$savedPos = s0;
                                        s1 = peg$c77(s2, s6);
                                        s0 = s1;
                                    }
                                    else {
                                        peg$currPos = s0;
                                        s0 = peg$FAILED;
                                    }
                                }
                                else {
                                    peg$currPos = s0;
                                    s0 = peg$FAILED;
                                }
                            }
                            else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                            }
                        }
                        else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
            return s0;
        }
        function peg$parsewhiteSpace() {
            var s0;
            peg$silentFails++;
            if (peg$c79.test(input.charAt(peg$currPos))) {
                s0 = input.charAt(peg$currPos);
                peg$currPos++;
            }
            else {
                s0 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c80);
                }
            }
            peg$silentFails--;
            if (s0 === peg$FAILED) {
                if (peg$silentFails === 0) {
                    peg$fail(peg$c78);
                }
            }
            return s0;
        }
        function peg$parsepatternSyntax() {
            var s0;
            peg$silentFails++;
            if (peg$c82.test(input.charAt(peg$currPos))) {
                s0 = input.charAt(peg$currPos);
                peg$currPos++;
            }
            else {
                s0 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c83);
                }
            }
            peg$silentFails--;
            if (s0 === peg$FAILED) {
                if (peg$silentFails === 0) {
                    peg$fail(peg$c81);
                }
            }
            return s0;
        }
        function peg$parse_() {
            var s0, s1, s2;
            peg$silentFails++;
            s0 = peg$currPos;
            s1 = [];
            s2 = peg$parsewhiteSpace();
            while (s2 !== peg$FAILED) {
                s1.push(s2);
                s2 = peg$parsewhiteSpace();
            }
            if (s1 !== peg$FAILED) {
                s0 = input.substring(s0, peg$currPos);
            }
            else {
                s0 = s1;
            }
            peg$silentFails--;
            if (s0 === peg$FAILED) {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c84);
                }
            }
            return s0;
        }
        function peg$parsenumber() {
            var s0, s1, s2;
            peg$silentFails++;
            s0 = peg$currPos;
            if (input.charCodeAt(peg$currPos) === 45) {
                s1 = peg$c86;
                peg$currPos++;
            }
            else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c87);
                }
            }
            if (s1 === peg$FAILED) {
                s1 = null;
            }
            if (s1 !== peg$FAILED) {
                s2 = peg$parseargNumber();
                if (s2 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s1 = peg$c88(s1, s2);
                    s0 = s1;
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
            peg$silentFails--;
            if (s0 === peg$FAILED) {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c85);
                }
            }
            return s0;
        }
        function peg$parsedoubleApostrophes() {
            var s0, s1;
            peg$silentFails++;
            s0 = peg$currPos;
            if (input.substr(peg$currPos, 2) === peg$c91) {
                s1 = peg$c91;
                peg$currPos += 2;
            }
            else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c92);
                }
            }
            if (s1 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c93();
            }
            s0 = s1;
            peg$silentFails--;
            if (s0 === peg$FAILED) {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c90);
                }
            }
            return s0;
        }
        function peg$parsequotedString() {
            var s0, s1, s2, s3, s4, s5;
            s0 = peg$currPos;
            if (input.charCodeAt(peg$currPos) === 39) {
                s1 = peg$c48;
                peg$currPos++;
            }
            else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c49);
                }
            }
            if (s1 !== peg$FAILED) {
                s2 = peg$parseescapedChar();
                if (s2 !== peg$FAILED) {
                    s3 = peg$currPos;
                    s4 = [];
                    if (input.substr(peg$currPos, 2) === peg$c91) {
                        s5 = peg$c91;
                        peg$currPos += 2;
                    }
                    else {
                        s5 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$c92);
                        }
                    }
                    if (s5 === peg$FAILED) {
                        if (peg$c50.test(input.charAt(peg$currPos))) {
                            s5 = input.charAt(peg$currPos);
                            peg$currPos++;
                        }
                        else {
                            s5 = peg$FAILED;
                            if (peg$silentFails === 0) {
                                peg$fail(peg$c51);
                            }
                        }
                    }
                    while (s5 !== peg$FAILED) {
                        s4.push(s5);
                        if (input.substr(peg$currPos, 2) === peg$c91) {
                            s5 = peg$c91;
                            peg$currPos += 2;
                        }
                        else {
                            s5 = peg$FAILED;
                            if (peg$silentFails === 0) {
                                peg$fail(peg$c92);
                            }
                        }
                        if (s5 === peg$FAILED) {
                            if (peg$c50.test(input.charAt(peg$currPos))) {
                                s5 = input.charAt(peg$currPos);
                                peg$currPos++;
                            }
                            else {
                                s5 = peg$FAILED;
                                if (peg$silentFails === 0) {
                                    peg$fail(peg$c51);
                                }
                            }
                        }
                    }
                    if (s4 !== peg$FAILED) {
                        s3 = input.substring(s3, peg$currPos);
                    }
                    else {
                        s3 = s4;
                    }
                    if (s3 !== peg$FAILED) {
                        if (input.charCodeAt(peg$currPos) === 39) {
                            s4 = peg$c48;
                            peg$currPos++;
                        }
                        else {
                            s4 = peg$FAILED;
                            if (peg$silentFails === 0) {
                                peg$fail(peg$c49);
                            }
                        }
                        if (s4 === peg$FAILED) {
                            s4 = null;
                        }
                        if (s4 !== peg$FAILED) {
                            peg$savedPos = s0;
                            s1 = peg$c94(s2, s3);
                            s0 = s1;
                        }
                        else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
            return s0;
        }
        function peg$parseunquotedString() {
            var s0, s1, s2, s3;
            s0 = peg$currPos;
            s1 = peg$currPos;
            if (input.length > peg$currPos) {
                s2 = input.charAt(peg$currPos);
                peg$currPos++;
            }
            else {
                s2 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c30);
                }
            }
            if (s2 !== peg$FAILED) {
                peg$savedPos = peg$currPos;
                s3 = peg$c95(s2);
                if (s3) {
                    s3 = undefined;
                }
                else {
                    s3 = peg$FAILED;
                }
                if (s3 !== peg$FAILED) {
                    s2 = [s2, s3];
                    s1 = s2;
                }
                else {
                    peg$currPos = s1;
                    s1 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s1;
                s1 = peg$FAILED;
            }
            if (s1 === peg$FAILED) {
                if (input.charCodeAt(peg$currPos) === 10) {
                    s1 = peg$c96;
                    peg$currPos++;
                }
                else {
                    s1 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$c97);
                    }
                }
            }
            if (s1 !== peg$FAILED) {
                s0 = input.substring(s0, peg$currPos);
            }
            else {
                s0 = s1;
            }
            return s0;
        }
        function peg$parseescapedChar() {
            var s0, s1, s2, s3;
            s0 = peg$currPos;
            s1 = peg$currPos;
            if (input.length > peg$currPos) {
                s2 = input.charAt(peg$currPos);
                peg$currPos++;
            }
            else {
                s2 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c30);
                }
            }
            if (s2 !== peg$FAILED) {
                peg$savedPos = peg$currPos;
                s3 = peg$c98(s2);
                if (s3) {
                    s3 = undefined;
                }
                else {
                    s3 = peg$FAILED;
                }
                if (s3 !== peg$FAILED) {
                    s2 = [s2, s3];
                    s1 = s2;
                }
                else {
                    peg$currPos = s1;
                    s1 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s1;
                s1 = peg$FAILED;
            }
            if (s1 !== peg$FAILED) {
                s0 = input.substring(s0, peg$currPos);
            }
            else {
                s0 = s1;
            }
            return s0;
        }
        function peg$parseargNameOrNumber() {
            var s0, s1;
            peg$silentFails++;
            s0 = peg$currPos;
            s1 = peg$parseargNumber();
            if (s1 === peg$FAILED) {
                s1 = peg$parseargName();
            }
            if (s1 !== peg$FAILED) {
                s0 = input.substring(s0, peg$currPos);
            }
            else {
                s0 = s1;
            }
            peg$silentFails--;
            if (s0 === peg$FAILED) {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c99);
                }
            }
            return s0;
        }
        function peg$parsevalidTag() {
            var s0, s1;
            peg$silentFails++;
            s0 = peg$currPos;
            s1 = peg$parseargNumber();
            if (s1 === peg$FAILED) {
                s1 = peg$parsetagName();
            }
            if (s1 !== peg$FAILED) {
                s0 = input.substring(s0, peg$currPos);
            }
            else {
                s0 = s1;
            }
            peg$silentFails--;
            if (s0 === peg$FAILED) {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c100);
                }
            }
            return s0;
        }
        function peg$parseargNumber() {
            var s0, s1, s2, s3, s4;
            peg$silentFails++;
            s0 = peg$currPos;
            if (input.charCodeAt(peg$currPos) === 48) {
                s1 = peg$c102;
                peg$currPos++;
            }
            else {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c103);
                }
            }
            if (s1 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$c104();
            }
            s0 = s1;
            if (s0 === peg$FAILED) {
                s0 = peg$currPos;
                s1 = peg$currPos;
                if (peg$c105.test(input.charAt(peg$currPos))) {
                    s2 = input.charAt(peg$currPos);
                    peg$currPos++;
                }
                else {
                    s2 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$c106);
                    }
                }
                if (s2 !== peg$FAILED) {
                    s3 = [];
                    if (peg$c107.test(input.charAt(peg$currPos))) {
                        s4 = input.charAt(peg$currPos);
                        peg$currPos++;
                    }
                    else {
                        s4 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$c108);
                        }
                    }
                    while (s4 !== peg$FAILED) {
                        s3.push(s4);
                        if (peg$c107.test(input.charAt(peg$currPos))) {
                            s4 = input.charAt(peg$currPos);
                            peg$currPos++;
                        }
                        else {
                            s4 = peg$FAILED;
                            if (peg$silentFails === 0) {
                                peg$fail(peg$c108);
                            }
                        }
                    }
                    if (s3 !== peg$FAILED) {
                        s2 = [s2, s3];
                        s1 = s2;
                    }
                    else {
                        peg$currPos = s1;
                        s1 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s1;
                    s1 = peg$FAILED;
                }
                if (s1 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s1 = peg$c109(s1);
                }
                s0 = s1;
            }
            peg$silentFails--;
            if (s0 === peg$FAILED) {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c101);
                }
            }
            return s0;
        }
        function peg$parseargName() {
            var s0, s1, s2, s3, s4;
            peg$silentFails++;
            s0 = peg$currPos;
            s1 = [];
            s2 = peg$currPos;
            s3 = peg$currPos;
            peg$silentFails++;
            s4 = peg$parsewhiteSpace();
            if (s4 === peg$FAILED) {
                s4 = peg$parsepatternSyntax();
            }
            peg$silentFails--;
            if (s4 === peg$FAILED) {
                s3 = undefined;
            }
            else {
                peg$currPos = s3;
                s3 = peg$FAILED;
            }
            if (s3 !== peg$FAILED) {
                if (input.length > peg$currPos) {
                    s4 = input.charAt(peg$currPos);
                    peg$currPos++;
                }
                else {
                    s4 = peg$FAILED;
                    if (peg$silentFails === 0) {
                        peg$fail(peg$c30);
                    }
                }
                if (s4 !== peg$FAILED) {
                    s3 = [s3, s4];
                    s2 = s3;
                }
                else {
                    peg$currPos = s2;
                    s2 = peg$FAILED;
                }
            }
            else {
                peg$currPos = s2;
                s2 = peg$FAILED;
            }
            if (s2 !== peg$FAILED) {
                while (s2 !== peg$FAILED) {
                    s1.push(s2);
                    s2 = peg$currPos;
                    s3 = peg$currPos;
                    peg$silentFails++;
                    s4 = peg$parsewhiteSpace();
                    if (s4 === peg$FAILED) {
                        s4 = peg$parsepatternSyntax();
                    }
                    peg$silentFails--;
                    if (s4 === peg$FAILED) {
                        s3 = undefined;
                    }
                    else {
                        peg$currPos = s3;
                        s3 = peg$FAILED;
                    }
                    if (s3 !== peg$FAILED) {
                        if (input.length > peg$currPos) {
                            s4 = input.charAt(peg$currPos);
                            peg$currPos++;
                        }
                        else {
                            s4 = peg$FAILED;
                            if (peg$silentFails === 0) {
                                peg$fail(peg$c30);
                            }
                        }
                        if (s4 !== peg$FAILED) {
                            s3 = [s3, s4];
                            s2 = s3;
                        }
                        else {
                            peg$currPos = s2;
                            s2 = peg$FAILED;
                        }
                    }
                    else {
                        peg$currPos = s2;
                        s2 = peg$FAILED;
                    }
                }
            }
            else {
                s1 = peg$FAILED;
            }
            if (s1 !== peg$FAILED) {
                s0 = input.substring(s0, peg$currPos);
            }
            else {
                s0 = s1;
            }
            peg$silentFails--;
            if (s0 === peg$FAILED) {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c110);
                }
            }
            return s0;
        }
        function peg$parsetagName() {
            var s0, s1, s2, s3, s4;
            peg$silentFails++;
            s0 = peg$currPos;
            s1 = [];
            if (input.charCodeAt(peg$currPos) === 45) {
                s2 = peg$c86;
                peg$currPos++;
            }
            else {
                s2 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c87);
                }
            }
            if (s2 === peg$FAILED) {
                s2 = peg$currPos;
                s3 = peg$currPos;
                peg$silentFails++;
                s4 = peg$parsewhiteSpace();
                if (s4 === peg$FAILED) {
                    s4 = peg$parsepatternSyntax();
                }
                peg$silentFails--;
                if (s4 === peg$FAILED) {
                    s3 = undefined;
                }
                else {
                    peg$currPos = s3;
                    s3 = peg$FAILED;
                }
                if (s3 !== peg$FAILED) {
                    if (input.length > peg$currPos) {
                        s4 = input.charAt(peg$currPos);
                        peg$currPos++;
                    }
                    else {
                        s4 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$c30);
                        }
                    }
                    if (s4 !== peg$FAILED) {
                        s3 = [s3, s4];
                        s2 = s3;
                    }
                    else {
                        peg$currPos = s2;
                        s2 = peg$FAILED;
                    }
                }
                else {
                    peg$currPos = s2;
                    s2 = peg$FAILED;
                }
            }
            if (s2 !== peg$FAILED) {
                while (s2 !== peg$FAILED) {
                    s1.push(s2);
                    if (input.charCodeAt(peg$currPos) === 45) {
                        s2 = peg$c86;
                        peg$currPos++;
                    }
                    else {
                        s2 = peg$FAILED;
                        if (peg$silentFails === 0) {
                            peg$fail(peg$c87);
                        }
                    }
                    if (s2 === peg$FAILED) {
                        s2 = peg$currPos;
                        s3 = peg$currPos;
                        peg$silentFails++;
                        s4 = peg$parsewhiteSpace();
                        if (s4 === peg$FAILED) {
                            s4 = peg$parsepatternSyntax();
                        }
                        peg$silentFails--;
                        if (s4 === peg$FAILED) {
                            s3 = undefined;
                        }
                        else {
                            peg$currPos = s3;
                            s3 = peg$FAILED;
                        }
                        if (s3 !== peg$FAILED) {
                            if (input.length > peg$currPos) {
                                s4 = input.charAt(peg$currPos);
                                peg$currPos++;
                            }
                            else {
                                s4 = peg$FAILED;
                                if (peg$silentFails === 0) {
                                    peg$fail(peg$c30);
                                }
                            }
                            if (s4 !== peg$FAILED) {
                                s3 = [s3, s4];
                                s2 = s3;
                            }
                            else {
                                peg$currPos = s2;
                                s2 = peg$FAILED;
                            }
                        }
                        else {
                            peg$currPos = s2;
                            s2 = peg$FAILED;
                        }
                    }
                }
            }
            else {
                s1 = peg$FAILED;
            }
            if (s1 !== peg$FAILED) {
                s0 = input.substring(s0, peg$currPos);
            }
            else {
                s0 = s1;
            }
            peg$silentFails--;
            if (s0 === peg$FAILED) {
                s1 = peg$FAILED;
                if (peg$silentFails === 0) {
                    peg$fail(peg$c111);
                }
            }
            return s0;
        }
        var messageCtx = ['root'];
        function isNestedMessageText() {
            return messageCtx.length > 1;
        }
        function isInPluralOption() {
            return messageCtx[messageCtx.length - 1] === 'plural';
        }
        function insertLocation() {
            return options && options.captureLocation ? {
                location: location()
            } : {};
        }
        var ignoreTag = options && options.ignoreTag;
        var shouldParseSkeleton = options && options.shouldParseSkeleton;
        peg$result = peg$startRuleFunction();
        if (peg$result !== peg$FAILED && peg$currPos === input.length) {
            return peg$result;
        }
        else {
            if (peg$result !== peg$FAILED && peg$currPos < input.length) {
                peg$fail(peg$endExpectation());
            }
            throw peg$buildStructuredError(peg$maxFailExpected, peg$maxFailPos < input.length ? input.charAt(peg$maxFailPos) : null, peg$maxFailPos < input.length
                ? peg$computeLocation(peg$maxFailPos, peg$maxFailPos + 1)
                : peg$computeLocation(peg$maxFailPos, peg$maxFailPos));
        }
    }
    var pegParse = peg$parse;

    var PLURAL_HASHTAG_REGEX = /(^|[^\\])#/g;
    /**
     * Whether to convert `#` in plural rule options
     * to `{var, number}`
     * @param el AST Element
     * @param pluralStack current plural stack
     */
    function normalizeHashtagInPlural(els) {
        els.forEach(function (el) {
            // If we're encountering a plural el
            if (!isPluralElement(el) && !isSelectElement(el)) {
                return;
            }
            // Go down the options and search for # in any literal element
            Object.keys(el.options).forEach(function (id) {
                var _a;
                var opt = el.options[id];
                // If we got a match, we have to split this
                // and inject a NumberElement in the middle
                var matchingLiteralElIndex = -1;
                var literalEl = undefined;
                for (var i = 0; i < opt.value.length; i++) {
                    var el_1 = opt.value[i];
                    if (isLiteralElement(el_1) && PLURAL_HASHTAG_REGEX.test(el_1.value)) {
                        matchingLiteralElIndex = i;
                        literalEl = el_1;
                        break;
                    }
                }
                if (literalEl) {
                    var newValue = literalEl.value.replace(PLURAL_HASHTAG_REGEX, "$1{" + el.value + ", number}");
                    var newEls = pegParse(newValue);
                    (_a = opt.value).splice.apply(_a, __spreadArrays([matchingLiteralElIndex, 1], newEls));
                }
                normalizeHashtagInPlural(opt.value);
            });
        });
    }

    function parse(input, opts) {
        opts = __assign({ normalizeHashtagInPlural: true, shouldParseSkeleton: true }, (opts || {}));
        var els = pegParse(input, opts);
        if (opts.normalizeHashtagInPlural) {
            normalizeHashtagInPlural(els);
        }
        return els;
    }

    //
    // Main
    //

    function memoize (fn, options) {
      var cache = options && options.cache
        ? options.cache
        : cacheDefault;

      var serializer = options && options.serializer
        ? options.serializer
        : serializerDefault;

      var strategy = options && options.strategy
        ? options.strategy
        : strategyDefault;

      return strategy(fn, {
        cache: cache,
        serializer: serializer
      })
    }

    //
    // Strategy
    //

    function isPrimitive (value) {
      return value == null || typeof value === 'number' || typeof value === 'boolean' // || typeof value === "string" 'unsafe' primitive for our needs
    }

    function monadic (fn, cache, serializer, arg) {
      var cacheKey = isPrimitive(arg) ? arg : serializer(arg);

      var computedValue = cache.get(cacheKey);
      if (typeof computedValue === 'undefined') {
        computedValue = fn.call(this, arg);
        cache.set(cacheKey, computedValue);
      }

      return computedValue
    }

    function variadic (fn, cache, serializer) {
      var args = Array.prototype.slice.call(arguments, 3);
      var cacheKey = serializer(args);

      var computedValue = cache.get(cacheKey);
      if (typeof computedValue === 'undefined') {
        computedValue = fn.apply(this, args);
        cache.set(cacheKey, computedValue);
      }

      return computedValue
    }

    function assemble (fn, context, strategy, cache, serialize) {
      return strategy.bind(
        context,
        fn,
        cache,
        serialize
      )
    }

    function strategyDefault (fn, options) {
      var strategy = fn.length === 1 ? monadic : variadic;

      return assemble(
        fn,
        this,
        strategy,
        options.cache.create(),
        options.serializer
      )
    }

    function strategyVariadic (fn, options) {
      var strategy = variadic;

      return assemble(
        fn,
        this,
        strategy,
        options.cache.create(),
        options.serializer
      )
    }

    function strategyMonadic (fn, options) {
      var strategy = monadic;

      return assemble(
        fn,
        this,
        strategy,
        options.cache.create(),
        options.serializer
      )
    }

    //
    // Serializer
    //

    function serializerDefault () {
      return JSON.stringify(arguments)
    }

    //
    // Cache
    //

    function ObjectWithoutPrototypeCache () {
      this.cache = Object.create(null);
    }

    ObjectWithoutPrototypeCache.prototype.has = function (key) {
      return (key in this.cache)
    };

    ObjectWithoutPrototypeCache.prototype.get = function (key) {
      return this.cache[key]
    };

    ObjectWithoutPrototypeCache.prototype.set = function (key, value) {
      this.cache[key] = value;
    };

    var cacheDefault = {
      create: function create () {
        return new ObjectWithoutPrototypeCache()
      }
    };

    //
    // API
    //

    var src = memoize;
    var strategies = {
      variadic: strategyVariadic,
      monadic: strategyMonadic
    };
    src.strategies = strategies;

    var memoize$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        'default': src,
        __moduleExports: src,
        strategies: strategies
    });

    var ErrorCode;
    (function (ErrorCode) {
        // When we have a placeholder but no value to format
        ErrorCode["MISSING_VALUE"] = "MISSING_VALUE";
        // When value supplied is invalid
        ErrorCode["INVALID_VALUE"] = "INVALID_VALUE";
        // When we need specific Intl API but it's not available
        ErrorCode["MISSING_INTL_API"] = "MISSING_INTL_API";
    })(ErrorCode || (ErrorCode = {}));
    var FormatError = /** @class */ (function (_super) {
        __extends(FormatError, _super);
        function FormatError(msg, code, originalMessage) {
            var _this = _super.call(this, msg) || this;
            _this.code = code;
            _this.originalMessage = originalMessage;
            return _this;
        }
        FormatError.prototype.toString = function () {
            return "[formatjs Error: " + this.code + "] " + this.message;
        };
        return FormatError;
    }(Error));
    var InvalidValueError = /** @class */ (function (_super) {
        __extends(InvalidValueError, _super);
        function InvalidValueError(variableId, value, options, originalMessage) {
            return _super.call(this, "Invalid values for \"" + variableId + "\": \"" + value + "\". Options are \"" + Object.keys(options).join('", "') + "\"", "INVALID_VALUE" /* INVALID_VALUE */, originalMessage) || this;
        }
        return InvalidValueError;
    }(FormatError));
    var InvalidValueTypeError = /** @class */ (function (_super) {
        __extends(InvalidValueTypeError, _super);
        function InvalidValueTypeError(value, type, originalMessage) {
            return _super.call(this, "Value for \"" + value + "\" must be of type " + type, "INVALID_VALUE" /* INVALID_VALUE */, originalMessage) || this;
        }
        return InvalidValueTypeError;
    }(FormatError));
    var MissingValueError = /** @class */ (function (_super) {
        __extends(MissingValueError, _super);
        function MissingValueError(variableId, originalMessage) {
            return _super.call(this, "The intl string context variable \"" + variableId + "\" was not provided to the string \"" + originalMessage + "\"", "MISSING_VALUE" /* MISSING_VALUE */, originalMessage) || this;
        }
        return MissingValueError;
    }(FormatError));

    var PART_TYPE;
    (function (PART_TYPE) {
        PART_TYPE[PART_TYPE["literal"] = 0] = "literal";
        PART_TYPE[PART_TYPE["object"] = 1] = "object";
    })(PART_TYPE || (PART_TYPE = {}));
    function mergeLiteral(parts) {
        if (parts.length < 2) {
            return parts;
        }
        return parts.reduce(function (all, part) {
            var lastPart = all[all.length - 1];
            if (!lastPart ||
                lastPart.type !== 0 /* literal */ ||
                part.type !== 0 /* literal */) {
                all.push(part);
            }
            else {
                lastPart.value += part.value;
            }
            return all;
        }, []);
    }
    function isFormatXMLElementFn(el) {
        return typeof el === 'function';
    }
    // TODO(skeleton): add skeleton support
    function formatToParts(els, locales, formatters, formats, values, currentPluralValue, 
    // For debugging
    originalMessage) {
        // Hot path for straight simple msg translations
        if (els.length === 1 && isLiteralElement(els[0])) {
            return [
                {
                    type: 0 /* literal */,
                    value: els[0].value,
                },
            ];
        }
        var result = [];
        for (var _i = 0, els_1 = els; _i < els_1.length; _i++) {
            var el = els_1[_i];
            // Exit early for string parts.
            if (isLiteralElement(el)) {
                result.push({
                    type: 0 /* literal */,
                    value: el.value,
                });
                continue;
            }
            // TODO: should this part be literal type?
            // Replace `#` in plural rules with the actual numeric value.
            if (isPoundElement(el)) {
                if (typeof currentPluralValue === 'number') {
                    result.push({
                        type: 0 /* literal */,
                        value: formatters.getNumberFormat(locales).format(currentPluralValue),
                    });
                }
                continue;
            }
            var varName = el.value;
            // Enforce that all required values are provided by the caller.
            if (!(values && varName in values)) {
                throw new MissingValueError(varName, originalMessage);
            }
            var value = values[varName];
            if (isArgumentElement(el)) {
                if (!value || typeof value === 'string' || typeof value === 'number') {
                    value =
                        typeof value === 'string' || typeof value === 'number'
                            ? String(value)
                            : '';
                }
                result.push({
                    type: typeof value === 'string' ? 0 /* literal */ : 1 /* object */,
                    value: value,
                });
                continue;
            }
            // Recursively format plural and select parts' option — which can be a
            // nested pattern structure. The choosing of the option to use is
            // abstracted-by and delegated-to the part helper object.
            if (isDateElement(el)) {
                var style = typeof el.style === 'string'
                    ? formats.date[el.style]
                    : isDateTimeSkeleton(el.style)
                        ? el.style.parsedOptions
                        : undefined;
                result.push({
                    type: 0 /* literal */,
                    value: formatters
                        .getDateTimeFormat(locales, style)
                        .format(value),
                });
                continue;
            }
            if (isTimeElement(el)) {
                var style = typeof el.style === 'string'
                    ? formats.time[el.style]
                    : isDateTimeSkeleton(el.style)
                        ? el.style.parsedOptions
                        : undefined;
                result.push({
                    type: 0 /* literal */,
                    value: formatters
                        .getDateTimeFormat(locales, style)
                        .format(value),
                });
                continue;
            }
            if (isNumberElement(el)) {
                var style = typeof el.style === 'string'
                    ? formats.number[el.style]
                    : isNumberSkeleton(el.style)
                        ? el.style.parsedOptions
                        : undefined;
                if (style && style.scale) {
                    value =
                        value *
                            (style.scale || 1);
                }
                result.push({
                    type: 0 /* literal */,
                    value: formatters
                        .getNumberFormat(locales, style)
                        .format(value),
                });
                continue;
            }
            if (isTagElement(el)) {
                var children = el.children, value_1 = el.value;
                var formatFn = values[value_1];
                if (!isFormatXMLElementFn(formatFn)) {
                    throw new InvalidValueTypeError(value_1, 'function', originalMessage);
                }
                var parts = formatToParts(children, locales, formatters, formats, values, currentPluralValue);
                var chunks = formatFn(parts.map(function (p) { return p.value; }));
                if (!Array.isArray(chunks)) {
                    chunks = [chunks];
                }
                result.push.apply(result, chunks.map(function (c) {
                    return {
                        type: typeof c === 'string' ? 0 /* literal */ : 1 /* object */,
                        value: c,
                    };
                }));
            }
            if (isSelectElement(el)) {
                var opt = el.options[value] || el.options.other;
                if (!opt) {
                    throw new InvalidValueError(el.value, value, Object.keys(el.options), originalMessage);
                }
                result.push.apply(result, formatToParts(opt.value, locales, formatters, formats, values));
                continue;
            }
            if (isPluralElement(el)) {
                var opt = el.options["=" + value];
                if (!opt) {
                    if (!Intl.PluralRules) {
                        throw new FormatError("Intl.PluralRules is not available in this environment.\nTry polyfilling it using \"@formatjs/intl-pluralrules\"\n", "MISSING_INTL_API" /* MISSING_INTL_API */, originalMessage);
                    }
                    var rule = formatters
                        .getPluralRules(locales, { type: el.pluralType })
                        .select(value - (el.offset || 0));
                    opt = el.options[rule] || el.options.other;
                }
                if (!opt) {
                    throw new InvalidValueError(el.value, value, Object.keys(el.options), originalMessage);
                }
                result.push.apply(result, formatToParts(opt.value, locales, formatters, formats, values, value - (el.offset || 0)));
                continue;
            }
        }
        return mergeLiteral(result);
    }

    /*
    Copyright (c) 2014, Yahoo! Inc. All rights reserved.
    Copyrights licensed under the New BSD License.
    See the accompanying LICENSE file for terms.
    */
    // -- MessageFormat --------------------------------------------------------
    function mergeConfig(c1, c2) {
        if (!c2) {
            return c1;
        }
        return __assign(__assign(__assign({}, (c1 || {})), (c2 || {})), Object.keys(c1).reduce(function (all, k) {
            all[k] = __assign(__assign({}, c1[k]), (c2[k] || {}));
            return all;
        }, {}));
    }
    function mergeConfigs(defaultConfig, configs) {
        if (!configs) {
            return defaultConfig;
        }
        return Object.keys(defaultConfig).reduce(function (all, k) {
            all[k] = mergeConfig(defaultConfig[k], configs[k]);
            return all;
        }, __assign({}, defaultConfig));
    }
    function createFastMemoizeCache(store) {
        return {
            create: function () {
                return {
                    has: function (key) {
                        return key in store;
                    },
                    get: function (key) {
                        return store[key];
                    },
                    set: function (key, value) {
                        store[key] = value;
                    },
                };
            },
        };
    }
    // @ts-ignore this is to deal with rollup's default import shenanigans
    var _memoizeIntl = src || memoize$1;
    var memoizeIntl = _memoizeIntl;
    function createDefaultFormatters(cache) {
        if (cache === void 0) { cache = {
            number: {},
            dateTime: {},
            pluralRules: {},
        }; }
        return {
            getNumberFormat: memoizeIntl(function () {
                var _a;
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                return new ((_a = Intl.NumberFormat).bind.apply(_a, __spreadArrays([void 0], args)))();
            }, {
                cache: createFastMemoizeCache(cache.number),
                strategy: memoizeIntl.strategies.variadic,
            }),
            getDateTimeFormat: memoizeIntl(function () {
                var _a;
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                return new ((_a = Intl.DateTimeFormat).bind.apply(_a, __spreadArrays([void 0], args)))();
            }, {
                cache: createFastMemoizeCache(cache.dateTime),
                strategy: memoizeIntl.strategies.variadic,
            }),
            getPluralRules: memoizeIntl(function () {
                var _a;
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                return new ((_a = Intl.PluralRules).bind.apply(_a, __spreadArrays([void 0], args)))();
            }, {
                cache: createFastMemoizeCache(cache.pluralRules),
                strategy: memoizeIntl.strategies.variadic,
            }),
        };
    }
    var IntlMessageFormat = /** @class */ (function () {
        function IntlMessageFormat(message, locales, overrideFormats, opts) {
            var _this = this;
            if (locales === void 0) { locales = IntlMessageFormat.defaultLocale; }
            this.formatterCache = {
                number: {},
                dateTime: {},
                pluralRules: {},
            };
            this.format = function (values) {
                var parts = _this.formatToParts(values);
                // Hot path for straight simple msg translations
                if (parts.length === 1) {
                    return parts[0].value;
                }
                var result = parts.reduce(function (all, part) {
                    if (!all.length ||
                        part.type !== 0 /* literal */ ||
                        typeof all[all.length - 1] !== 'string') {
                        all.push(part.value);
                    }
                    else {
                        all[all.length - 1] += part.value;
                    }
                    return all;
                }, []);
                if (result.length <= 1) {
                    return result[0] || '';
                }
                return result;
            };
            this.formatToParts = function (values) {
                return formatToParts(_this.ast, _this.locales, _this.formatters, _this.formats, values, undefined, _this.message);
            };
            this.resolvedOptions = function () { return ({
                locale: Intl.NumberFormat.supportedLocalesOf(_this.locales)[0],
            }); };
            this.getAst = function () { return _this.ast; };
            if (typeof message === 'string') {
                this.message = message;
                if (!IntlMessageFormat.__parse) {
                    throw new TypeError('IntlMessageFormat.__parse must be set to process `message` of type `string`');
                }
                // Parse string messages into an AST.
                this.ast = IntlMessageFormat.__parse(message, {
                    normalizeHashtagInPlural: false,
                    ignoreTag: opts === null || opts === void 0 ? void 0 : opts.ignoreTag,
                });
            }
            else {
                this.ast = message;
            }
            if (!Array.isArray(this.ast)) {
                throw new TypeError('A message must be provided as a String or AST.');
            }
            // Creates a new object with the specified `formats` merged with the default
            // formats.
            this.formats = mergeConfigs(IntlMessageFormat.formats, overrideFormats);
            // Defined first because it's used to build the format pattern.
            this.locales = locales;
            this.formatters =
                (opts && opts.formatters) || createDefaultFormatters(this.formatterCache);
        }
        Object.defineProperty(IntlMessageFormat, "defaultLocale", {
            get: function () {
                if (!IntlMessageFormat.memoizedDefaultLocale) {
                    IntlMessageFormat.memoizedDefaultLocale = new Intl.NumberFormat().resolvedOptions().locale;
                }
                return IntlMessageFormat.memoizedDefaultLocale;
            },
            enumerable: false,
            configurable: true
        });
        IntlMessageFormat.memoizedDefaultLocale = null;
        IntlMessageFormat.__parse = parse;
        // Default format options used as the prototype of the `formats` provided to the
        // constructor. These are used when constructing the internal Intl.NumberFormat
        // and Intl.DateTimeFormat instances.
        IntlMessageFormat.formats = {
            number: {
                currency: {
                    style: 'currency',
                },
                percent: {
                    style: 'percent',
                },
            },
            date: {
                short: {
                    month: 'numeric',
                    day: 'numeric',
                    year: '2-digit',
                },
                medium: {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                },
                long: {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                },
                full: {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                },
            },
            time: {
                short: {
                    hour: 'numeric',
                    minute: 'numeric',
                },
                medium: {
                    hour: 'numeric',
                    minute: 'numeric',
                    second: 'numeric',
                },
                long: {
                    hour: 'numeric',
                    minute: 'numeric',
                    second: 'numeric',
                    timeZoneName: 'short',
                },
                full: {
                    hour: 'numeric',
                    minute: 'numeric',
                    second: 'numeric',
                    timeZoneName: 'short',
                },
            },
        };
        return IntlMessageFormat;
    }());

    /*
    Copyright (c) 2014, Yahoo! Inc. All rights reserved.
    Copyrights licensed under the New BSD License.
    See the accompanying LICENSE file for terms.
    */

    let i;const a=writable({});function l(e){return e in i}function s(e,n){if(!l(e))return null;const t=function(e){return i[e]||null}(e);if(n in t)return t[n];return dlv_umd(t,n)}function u(e){return null==e||l(e)?e:u(D(e))}function c(e,...n){a.update((o=>(o[e]=cjs.all([o[e]||{},...n]),o)));}const m=derived([a],(([e])=>Object.keys(e)));a.subscribe((e=>i=e));const f={};function d(e){return f[e]}function w(e){return I(e).reverse().some((e=>{var n;return null===(n=d(e))||void 0===n?void 0:n.size}))}function g(e,n){return Promise.all(n.map((n=>(function(e,n){f[e].delete(n),0===f[e].size&&delete f[e];}(e,n),n().then((e=>e.default||e)))))).then((n=>c(e,...n)))}const h={};function p(e){if(!w(e))return e in h?h[e]:void 0;const n=function(e){return I(e).reverse().map((e=>{const n=d(e);return [e,n?[...n]:[]]})).filter((([,e])=>e.length>0))}(e);return h[e]=Promise.all(n.map((([e,n])=>g(e,n)))).then((()=>{if(w(e))return p(e);delete h[e];})),h[e]}/*! *****************************************************************************
    Copyright (c) Microsoft Corporation.

    Permission to use, copy, modify, and/or distribute this software for any
    purpose with or without fee is hereby granted.

    THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
    REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
    AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
    INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
    LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
    OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
    PERFORMANCE OF THIS SOFTWARE.
    ***************************************************************************** */function y(e,n){var t={};for(var o in e)Object.prototype.hasOwnProperty.call(e,o)&&n.indexOf(o)<0&&(t[o]=e[o]);if(null!=e&&"function"==typeof Object.getOwnPropertySymbols){var r=0;for(o=Object.getOwnPropertySymbols(e);r<o.length;r++)n.indexOf(o[r])<0&&Object.prototype.propertyIsEnumerable.call(e,o[r])&&(t[o[r]]=e[o[r]]);}return t}const v={fallbackLocale:null,initialLocale:null,loadingDelay:200,formats:{number:{scientific:{notation:"scientific"},engineering:{notation:"engineering"},compactLong:{notation:"compact",compactDisplay:"long"},compactShort:{notation:"compact",compactDisplay:"short"}},date:{short:{month:"numeric",day:"numeric",year:"2-digit"},medium:{month:"short",day:"numeric",year:"numeric"},long:{month:"long",day:"numeric",year:"numeric"},full:{weekday:"long",month:"long",day:"numeric",year:"numeric"}},time:{short:{hour:"numeric",minute:"numeric"},medium:{hour:"numeric",minute:"numeric",second:"numeric"},long:{hour:"numeric",minute:"numeric",second:"numeric",timeZoneName:"short"},full:{hour:"numeric",minute:"numeric",second:"numeric",timeZoneName:"short"}}},warnOnMissingMessages:!0};function O(){return v}function j(e){const{formats:n}=e,t=y(e,["formats"]),o=e.initialLocale||e.fallbackLocale;return Object.assign(v,t,{initialLocale:o}),n&&("number"in n&&Object.assign(v.formats.number,n.number),"date"in n&&Object.assign(v.formats.date,n.date),"time"in n&&Object.assign(v.formats.time,n.time)),x.set(o)}const L=writable(!1);let k;const x=writable(null);function $(e,n){return 0===n.indexOf(e)&&e!==n}function E(e,n){return e===n||$(e,n)||$(n,e)}function D(e){const n=e.lastIndexOf("-");if(n>0)return e.slice(0,n);const{fallbackLocale:t}=O();return t&&!E(e,t)?t:null}function I(e){const n=e.split("-").map(((e,n,t)=>t.slice(0,n+1).join("-"))),{fallbackLocale:t}=O();return t&&!E(e,t)?n.concat(I(t)):n}function M(){return k}x.subscribe((e=>{k=e,"undefined"!=typeof window&&document.documentElement.setAttribute("lang",e);}));const N=x.set;x.set=e=>{if(u(e)&&w(e)){const{loadingDelay:n}=O();let t;return "undefined"!=typeof window&&null!=M()&&n?t=window.setTimeout((()=>L.set(!0)),n):L.set(!0),p(e).then((()=>{N(e);})).finally((()=>{clearTimeout(t),L.set(!1);}))}return N(e)},x.update=e=>N(e(k));const F=()=>"undefined"==typeof window?null:window.navigator.language||window.navigator.languages[0],C={},G=(e,n)=>{if(null==n)return;const t=s(n,e);return t||G(e,D(n))},J=(e,n)=>{if(n in C&&e in C[n])return C[n][e];const t=G(e,n);return t?((e,n,t)=>t?(n in C||(C[n]={}),e in C[n]||(C[n][e]=t),t):t)(e,n,t):void 0},U=e=>{const n=Object.create(null);return t=>{const o=JSON.stringify(t);return o in n?n[o]:n[o]=e(t)}},_=(e,n)=>{const{formats:t}=O();if(e in t&&n in t[e])return t[e][n];throw new Error(`[svelte-i18n] Unknown "${n}" ${e} format.`)},q=U((e=>{var{locale:n,format:t}=e,o=y(e,["locale","format"]);if(null==n)throw new Error('[svelte-i18n] A "locale" must be set to format numbers');return t&&(o=_("number",t)),new Intl.NumberFormat(n,o)})),B=U((e=>{var{locale:n,format:t}=e,o=y(e,["locale","format"]);if(null==n)throw new Error('[svelte-i18n] A "locale" must be set to format dates');return t?o=_("date",t):0===Object.keys(o).length&&(o=_("date","short")),new Intl.DateTimeFormat(n,o)})),H=U((e=>{var{locale:n,format:t}=e,o=y(e,["locale","format"]);if(null==n)throw new Error('[svelte-i18n] A "locale" must be set to format time values');return t?o=_("time",t):0===Object.keys(o).length&&(o=_("time","short")),new Intl.DateTimeFormat(n,o)})),K=(e={})=>{var{locale:n=M()}=e,t=y(e,["locale"]);return q(Object.assign({locale:n},t))},Q=(e={})=>{var{locale:n=M()}=e,t=y(e,["locale"]);return B(Object.assign({locale:n},t))},R=(e={})=>{var{locale:n=M()}=e,t=y(e,["locale"]);return H(Object.assign({locale:n},t))},V=U(((e,n=M())=>new IntlMessageFormat(e,n,O().formats))),W=(e,n={})=>{"object"==typeof e&&(e=(n=e).id);const{values:t,locale:o=M(),default:r}=n;if(null==o)throw new Error("[svelte-i18n] Cannot format a message without first setting the initial locale.");let i=J(e,o);if(i){if("string"!=typeof i)return console.warn(`[svelte-i18n] Message with id "${e}" must be of type "string", found: "${typeof i}". Gettin its value through the "$format" method is deprecated; use the "json" method instead.`),i}else O().warnOnMissingMessages&&console.warn(`[svelte-i18n] The message "${e}" was not found in "${I(o).join('", "')}".${w(M())?"\n\nNote: there are at least one loader still registered to this locale that wasn't executed.":""}`),i=r||e;return t?V(i,o).format(t):i},X=(e,n)=>R(n).format(e),Y=(e,n)=>Q(n).format(e),ee=(e,n)=>K(n).format(e),ne=(e,n=M())=>J(e,n),te=derived([x,a],(()=>W)),oe=derived([x],(()=>X)),re=derived([x],(()=>Y)),ie=derived([x],(()=>ee)),ae=derived([x,a],(()=>ne));

    const MESSAGE_FILE_URL_TEMPLATE = '/lang/{locale}.json';

    function setupI18n({ withLocale }) {

      const _locale = supported(withLocale) || fallbackLocale;
      
      const messsagesFileUrl = MESSAGE_FILE_URL_TEMPLATE.replace('{locale}', _locale);

      return fetch(messsagesFileUrl)
        .then(response => response.json())
        .then((messages) => {
          a.set({ [_locale]: messages });

          x.set(_locale);
          j({
            fallbackLocale: 'en',
            initialLocale: _locale,
          });
        });
    }

    const isLocaleLoaded = derived(x, $locale => typeof $locale === 'string');

    const dir = derived(x, $locale => $locale === 'ar' ? 'rtl' : 'ltr');

    const locales = {
      en: "English",
      'en-us': "English (US)",
    };

    const supported = (locale) => {
      console.log(locale);
      if (Object.keys(locales).includes(locale.toLowerCase())) {
        return locale;
      } else {
        return 'en';
      }
    };

    const pages = {
      home: 'Home',
      app: 'App',
      about: 'About',
      pricing: 'Pricing',
      faqs: 'FAQs',
      contact: 'Contact'
    };

    const mobilePages = {
      home: 'Home',
      about: 'About',
      app: 'App',
      pricing: 'Pricing',
      faqs: 'FAQs',
      contact: 'Contact'
    };

    /* src/components/Header.svelte generated by Svelte v3.29.0 */

    const { Object: Object_1 } = globals;
    const file = "src/components/Header.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	return child_ctx;
    }

    // (53:4) {#each Object.values(pages) as pageTitle}
    function create_each_block_1(ctx) {
    	let li;
    	let button;
    	let t0_value = /*pageTitle*/ ctx[8] + "";
    	let t0;
    	let button_class_value;
    	let t1;
    	let mounted;
    	let dispose;

    	function click_handler_2(...args) {
    		return /*click_handler_2*/ ctx[6](/*pageTitle*/ ctx[8], ...args);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			button = element("button");
    			t0 = text(t0_value);
    			t1 = space();

    			attr_dev(button, "class", button_class_value = "" + (null_to_empty(`${/*page*/ ctx[0] === /*pageTitle*/ ctx[8]
			? "selected"
			: ""}`) + " svelte-1pnh5qj"));

    			add_location(button, file, 54, 8, 1492);
    			add_location(li, file, 53, 6, 1479);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, button);
    			append_dev(button, t0);
    			append_dev(li, t1);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler_2, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*page*/ 1 && button_class_value !== (button_class_value = "" + (null_to_empty(`${/*page*/ ctx[0] === /*pageTitle*/ ctx[8]
			? "selected"
			: ""}`) + " svelte-1pnh5qj"))) {
    				attr_dev(button, "class", button_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(53:4) {#each Object.values(pages) as pageTitle}",
    		ctx
    	});

    	return block;
    }

    // (65:4) {#each Object.values(mobilePages) as pageTitle}
    function create_each_block(ctx) {
    	let li;
    	let button;
    	let t0_value = /*pageTitle*/ ctx[8] + "";
    	let t0;
    	let button_class_value;
    	let t1;
    	let mounted;
    	let dispose;

    	function click_handler_3(...args) {
    		return /*click_handler_3*/ ctx[7](/*pageTitle*/ ctx[8], ...args);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			button = element("button");
    			t0 = text(t0_value);
    			t1 = space();

    			attr_dev(button, "class", button_class_value = "" + (null_to_empty(`${/*page*/ ctx[0] === /*pageTitle*/ ctx[8]
			? "selected"
			: ""}`) + " svelte-1pnh5qj"));

    			add_location(button, file, 66, 8, 1792);
    			attr_dev(li, "class", "svelte-1pnh5qj");
    			add_location(li, file, 65, 6, 1779);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, button);
    			append_dev(button, t0);
    			append_dev(li, t1);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler_3, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*page*/ 1 && button_class_value !== (button_class_value = "" + (null_to_empty(`${/*page*/ ctx[0] === /*pageTitle*/ ctx[8]
			? "selected"
			: ""}`) + " svelte-1pnh5qj"))) {
    				attr_dev(button, "class", button_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(65:4) {#each Object.values(mobilePages) as pageTitle}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let header;
    	let div1;
    	let img0;
    	let img0_src_value;
    	let t0;
    	let img1;
    	let img1_src_value;
    	let t1;
    	let section;
    	let h1;
    	let img2;
    	let img2_src_value;
    	let t2;
    	let t3_value = /*$_*/ ctx[2]("hero.title") + "";
    	let t3;
    	let sup;
    	let t5;
    	let h3;
    	let t6_value = /*$_*/ ctx[2]("hero.subtitle") + "";
    	let t6;
    	let t7;
    	let div0;
    	let button0;
    	let img3;
    	let img3_src_value;
    	let t8;
    	let button1;
    	let img4;
    	let img4_src_value;
    	let t9;
    	let nav0;
    	let ul0;
    	let t10;
    	let nav1;
    	let ul1;
    	let mounted;
    	let dispose;
    	let each_value_1 = Object.values(pages);
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	let each_value = Object.values(mobilePages);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			header = element("header");
    			div1 = element("div");
    			img0 = element("img");
    			t0 = space();
    			img1 = element("img");
    			t1 = space();
    			section = element("section");
    			h1 = element("h1");
    			img2 = element("img");
    			t2 = space();
    			t3 = text(t3_value);
    			sup = element("sup");
    			sup.textContent = "®";
    			t5 = space();
    			h3 = element("h3");
    			t6 = text(t6_value);
    			t7 = space();
    			div0 = element("div");
    			button0 = element("button");
    			img3 = element("img");
    			t8 = space();
    			button1 = element("button");
    			img4 = element("img");
    			t9 = space();
    			nav0 = element("nav");
    			ul0 = element("ul");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t10 = space();
    			nav1 = element("nav");
    			ul1 = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(img0, "class", "mobile-hero-image svelte-1pnh5qj");
    			if (img0.src !== (img0_src_value = "images/appIcon.svg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "Lemmi Logo");
    			add_location(img0, file, 17, 4, 449);
    			attr_dev(img1, "class", "hero-image svelte-1pnh5qj");
    			if (img1.src !== (img1_src_value = "images/hero-image.png")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "Lemmi shown on an iPad and iPhone");
    			add_location(img1, file, 18, 4, 529);
    			attr_dev(img2, "class", "logo svelte-1pnh5qj");
    			if (img2.src !== (img2_src_value = "images/appIcon.svg")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "alt", "Lemmi Logo");
    			add_location(img2, file, 25, 8, 711);
    			attr_dev(sup, "class", "svelte-1pnh5qj");
    			add_location(sup, file, 26, 26, 800);
    			attr_dev(h1, "class", "title svelte-1pnh5qj");
    			add_location(h1, file, 24, 6, 684);
    			attr_dev(h3, "class", "subtitle svelte-1pnh5qj");
    			add_location(h3, file, 28, 6, 831);
    			attr_dev(img3, "class", "app-icon svelte-1pnh5qj");
    			if (img3.src !== (img3_src_value = "images/app-store.png")) attr_dev(img3, "src", img3_src_value);
    			attr_dev(img3, "alt", "Download on the App Store");
    			add_location(img3, file, 33, 10, 991);
    			attr_dev(button0, "class", "svelte-1pnh5qj");
    			add_location(button0, file, 30, 8, 919);
    			attr_dev(img4, "class", "play-icon svelte-1pnh5qj");
    			if (img4.src !== (img4_src_value = "images/play-store.png")) attr_dev(img4, "src", img4_src_value);
    			attr_dev(img4, "alt", "Download on the Play Store");
    			add_location(img4, file, 41, 10, 1210);
    			attr_dev(button1, "class", "svelte-1pnh5qj");
    			add_location(button1, file, 38, 8, 1137);
    			attr_dev(div0, "class", "store-icons svelte-1pnh5qj");
    			add_location(div0, file, 29, 6, 885);
    			attr_dev(section, "class", "hero-info svelte-1pnh5qj");
    			add_location(section, file, 23, 4, 650);
    			attr_dev(div1, "class", "header-wrapper svelte-1pnh5qj");
    			add_location(div1, file, 16, 2, 416);
    			attr_dev(header, "class", "svelte-1pnh5qj");
    			add_location(header, file, 15, 0, 405);
    			attr_dev(ul0, "class", "svelte-1pnh5qj");
    			add_location(ul0, file, 51, 2, 1422);
    			attr_dev(nav0, "class", "nav-bar svelte-1pnh5qj");
    			add_location(nav0, file, 50, 0, 1398);
    			attr_dev(ul1, "class", "svelte-1pnh5qj");
    			add_location(ul1, file, 63, 2, 1716);
    			attr_dev(nav1, "class", "mobile-nav svelte-1pnh5qj");
    			add_location(nav1, file, 62, 0, 1689);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, div1);
    			append_dev(div1, img0);
    			append_dev(div1, t0);
    			append_dev(div1, img1);
    			append_dev(div1, t1);
    			append_dev(div1, section);
    			append_dev(section, h1);
    			append_dev(h1, img2);
    			append_dev(h1, t2);
    			append_dev(h1, t3);
    			append_dev(h1, sup);
    			append_dev(section, t5);
    			append_dev(section, h3);
    			append_dev(h3, t6);
    			append_dev(section, t7);
    			append_dev(section, div0);
    			append_dev(div0, button0);
    			append_dev(button0, img3);
    			append_dev(div0, t8);
    			append_dev(div0, button1);
    			append_dev(button1, img4);
    			insert_dev(target, t9, anchor);
    			insert_dev(target, nav0, anchor);
    			append_dev(nav0, ul0);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(ul0, null);
    			}

    			insert_dev(target, t10, anchor);
    			insert_dev(target, nav1, anchor);
    			append_dev(nav1, ul1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul1, null);
    			}

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[4], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[5], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$_*/ 4 && t3_value !== (t3_value = /*$_*/ ctx[2]("hero.title") + "")) set_data_dev(t3, t3_value);
    			if (dirty & /*$_*/ 4 && t6_value !== (t6_value = /*$_*/ ctx[2]("hero.subtitle") + "")) set_data_dev(t6, t6_value);

    			if (dirty & /*page, Object, pages, handleClickNavigation*/ 3) {
    				each_value_1 = Object.values(pages);
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(ul0, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*page, Object, mobilePages, handleClickNavigation*/ 3) {
    				each_value = Object.values(mobilePages);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    			if (detaching) detach_dev(t9);
    			if (detaching) detach_dev(nav0);
    			destroy_each(each_blocks_1, detaching);
    			if (detaching) detach_dev(t10);
    			if (detaching) detach_dev(nav1);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let $_;
    	validate_store(te, "_");
    	component_subscribe($$self, te, $$value => $$invalidate(2, $_ = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Header", slots, []);
    	let { page } = $$props;
    	let { handleClickNavigation } = $$props;

    	const openStore = store => {
    		if (store === "app") {
    			window.open("https://apps.apple.com/us/app/lemmi/id1519868911");
    		} else {
    			window.open("http://play.google.com/store/apps/details?id=com.jenix.lemmi");
    		}
    	};

    	const writable_props = ["page", "handleClickNavigation"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Header> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => openStore("app");
    	const click_handler_1 = () => openStore("play");
    	const click_handler_2 = pageTitle => handleClickNavigation(pageTitle);
    	const click_handler_3 = pageTitle => handleClickNavigation(pageTitle);

    	$$self.$$set = $$props => {
    		if ("page" in $$props) $$invalidate(0, page = $$props.page);
    		if ("handleClickNavigation" in $$props) $$invalidate(1, handleClickNavigation = $$props.handleClickNavigation);
    	};

    	$$self.$capture_state = () => ({
    		_: te,
    		pages,
    		mobilePages,
    		page,
    		handleClickNavigation,
    		openStore,
    		$_
    	});

    	$$self.$inject_state = $$props => {
    		if ("page" in $$props) $$invalidate(0, page = $$props.page);
    		if ("handleClickNavigation" in $$props) $$invalidate(1, handleClickNavigation = $$props.handleClickNavigation);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		page,
    		handleClickNavigation,
    		$_,
    		openStore,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3
    	];
    }

    class Header extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { page: 0, handleClickNavigation: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Header",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*page*/ ctx[0] === undefined && !("page" in props)) {
    			console.warn("<Header> was created without expected prop 'page'");
    		}

    		if (/*handleClickNavigation*/ ctx[1] === undefined && !("handleClickNavigation" in props)) {
    			console.warn("<Header> was created without expected prop 'handleClickNavigation'");
    		}
    	}

    	get page() {
    		throw new Error("<Header>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set page(value) {
    		throw new Error("<Header>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get handleClickNavigation() {
    		throw new Error("<Header>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set handleClickNavigation(value) {
    		throw new Error("<Header>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/pages/Home.svelte generated by Svelte v3.29.0 */
    const file$1 = "src/pages/Home.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[15] = list[i];
    	return child_ctx;
    }

    // (68:10) {#each $_('home.freetrial.images') as src}
    function create_each_block_2(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			attr_dev(img, "class", "carousel-item svelte-13sqoya");
    			if (img.src !== (img_src_value = /*src*/ ctx[15])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Screenshot of Lemmi running on iOS");
    			add_location(img, file$1, 68, 12, 2171);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$_*/ 4 && img.src !== (img_src_value = /*src*/ ctx[15])) {
    				attr_dev(img, "src", img_src_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(68:10) {#each $_('home.freetrial.images') as src}",
    		ctx
    	});

    	return block;
    }

    // (87:4) {#each $_('home.help.usps') as usp}
    function create_each_block_1$1(ctx) {
    	let div1;
    	let div0;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t0;
    	let p0;
    	let t1_value = /*usp*/ ctx[12].title.toUpperCase() + "";
    	let t1;
    	let t2;
    	let p1;
    	let t3_value = /*usp*/ ctx[12].description + "";
    	let t3;
    	let t4;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			p0 = element("p");
    			t1 = text(t1_value);
    			t2 = space();
    			p1 = element("p");
    			t3 = text(t3_value);
    			t4 = space();
    			if (img.src !== (img_src_value = /*usp*/ ctx[12].image)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*usp*/ ctx[12].title);
    			attr_dev(img, "class", "svelte-13sqoya");
    			add_location(img, file$1, 89, 10, 2848);
    			attr_dev(div0, "class", "usp-image-wrapper svelte-13sqoya");
    			add_location(div0, file$1, 88, 8, 2806);
    			attr_dev(p0, "class", "usp-title svelte-13sqoya");
    			add_location(p0, file$1, 91, 8, 2911);
    			attr_dev(p1, "class", "usp-description svelte-13sqoya");
    			add_location(p1, file$1, 92, 8, 2970);
    			attr_dev(div1, "class", "usp svelte-13sqoya");
    			add_location(div1, file$1, 87, 6, 2780);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, img);
    			append_dev(div1, t0);
    			append_dev(div1, p0);
    			append_dev(p0, t1);
    			append_dev(div1, t2);
    			append_dev(div1, p1);
    			append_dev(p1, t3);
    			append_dev(div1, t4);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$_*/ 4 && img.src !== (img_src_value = /*usp*/ ctx[12].image)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*$_*/ 4 && img_alt_value !== (img_alt_value = /*usp*/ ctx[12].title)) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (dirty & /*$_*/ 4 && t1_value !== (t1_value = /*usp*/ ctx[12].title.toUpperCase() + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*$_*/ 4 && t3_value !== (t3_value = /*usp*/ ctx[12].description + "")) set_data_dev(t3, t3_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(87:4) {#each $_('home.help.usps') as usp}",
    		ctx
    	});

    	return block;
    }

    // (102:6) {#each $_('home.anatomy') as item}
    function create_each_block$1(ctx) {
    	let div1;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t0;
    	let div0;
    	let p0;
    	let t1_value = /*item*/ ctx[9].title.toUpperCase() + "";
    	let t1;
    	let t2;
    	let p1;
    	let t3_value = /*item*/ ctx[9].desciption + "";
    	let t3;
    	let t4;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			img = element("img");
    			t0 = space();
    			div0 = element("div");
    			p0 = element("p");
    			t1 = text(t1_value);
    			t2 = space();
    			p1 = element("p");
    			t3 = text(t3_value);
    			t4 = space();
    			attr_dev(img, "class", "anatomy-icon svelte-13sqoya");
    			if (img.src !== (img_src_value = /*item*/ ctx[9].image)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*item*/ ctx[9].title);
    			add_location(img, file$1, 103, 10, 3325);
    			add_location(p0, file$1, 105, 12, 3437);
    			add_location(p1, file$1, 106, 12, 3483);
    			attr_dev(div0, "class", "anatomy-text svelte-13sqoya");
    			add_location(div0, file$1, 104, 10, 3398);
    			attr_dev(div1, "class", "anatomy-item reversed svelte-13sqoya");
    			add_location(div1, file$1, 102, 8, 3279);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, img);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, p0);
    			append_dev(p0, t1);
    			append_dev(div0, t2);
    			append_dev(div0, p1);
    			append_dev(p1, t3);
    			append_dev(div1, t4);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$_*/ 4 && img.src !== (img_src_value = /*item*/ ctx[9].image)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*$_*/ 4 && img_alt_value !== (img_alt_value = /*item*/ ctx[9].title)) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (dirty & /*$_*/ 4 && t1_value !== (t1_value = /*item*/ ctx[9].title.toUpperCase() + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*$_*/ 4 && t3_value !== (t3_value = /*item*/ ctx[9].desciption + "")) set_data_dev(t3, t3_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(102:6) {#each $_('home.anatomy') as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let section0;
    	let h20;
    	let t0_value = /*$_*/ ctx[2]("home.intro.text1") + "";
    	let t0;
    	let t1;
    	let p0;
    	let t2_value = /*$_*/ ctx[2]("home.intro.text2") + "";
    	let t2;
    	let t3;
    	let section1;
    	let div4;
    	let div0;
    	let h21;
    	let t4_value = /*$_*/ ctx[2]("home.freetrial.title") + "";
    	let t4;
    	let t5;
    	let p1;
    	let t6_value = /*$_*/ ctx[2]("home.freetrial.subtitle") + "";
    	let t6;
    	let t7;
    	let button0;
    	let t9;
    	let p2;
    	let t10_value = /*$_*/ ctx[2]("home.freetrial.description") + "";
    	let t10;
    	let t11;
    	let div3;
    	let div2;
    	let div1;
    	let t12;
    	let section2;
    	let p3;
    	let t13_value = /*$_*/ ctx[2]("home.blurb.text1") + "";
    	let t13;
    	let t14;
    	let button1;
    	let t15_value = /*$_*/ ctx[2]("home.blurb.action") + "";
    	let t15;
    	let t16;
    	let section3;
    	let h3;
    	let t17_value = /*$_*/ ctx[2]("home.help.title") + "";
    	let t17;
    	let t18;
    	let div5;
    	let t19;
    	let section4;
    	let div7;
    	let img;
    	let img_src_value;
    	let t20;
    	let div6;
    	let mounted;
    	let dispose;
    	let each_value_2 = /*$_*/ ctx[2]("home.freetrial.images");
    	validate_each_argument(each_value_2);
    	let each_blocks_2 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_2[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	let each_value_1 = /*$_*/ ctx[2]("home.help.usps");
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	let each_value = /*$_*/ ctx[2]("home.anatomy");
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			section0 = element("section");
    			h20 = element("h2");
    			t0 = text(t0_value);
    			t1 = space();
    			p0 = element("p");
    			t2 = text(t2_value);
    			t3 = space();
    			section1 = element("section");
    			div4 = element("div");
    			div0 = element("div");
    			h21 = element("h2");
    			t4 = text(t4_value);
    			t5 = space();
    			p1 = element("p");
    			t6 = text(t6_value);
    			t7 = space();
    			button0 = element("button");
    			button0.textContent = "Get 1 week free";
    			t9 = space();
    			p2 = element("p");
    			t10 = text(t10_value);
    			t11 = space();
    			div3 = element("div");
    			div2 = element("div");
    			div1 = element("div");

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].c();
    			}

    			t12 = space();
    			section2 = element("section");
    			p3 = element("p");
    			t13 = text(t13_value);
    			t14 = space();
    			button1 = element("button");
    			t15 = text(t15_value);
    			t16 = space();
    			section3 = element("section");
    			h3 = element("h3");
    			t17 = text(t17_value);
    			t18 = space();
    			div5 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t19 = space();
    			section4 = element("section");
    			div7 = element("div");
    			img = element("img");
    			t20 = space();
    			div6 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(h20, "class", "svelte-13sqoya");
    			add_location(h20, file$1, 50, 2, 1348);
    			attr_dev(p0, "class", "svelte-13sqoya");
    			add_location(p0, file$1, 51, 2, 1384);
    			attr_dev(section0, "class", "home-intro svelte-13sqoya");
    			add_location(section0, file$1, 49, 0, 1317);
    			attr_dev(h21, "class", "svelte-13sqoya");
    			add_location(h21, file$1, 56, 6, 1529);
    			attr_dev(p1, "class", "svelte-13sqoya");
    			add_location(p1, file$1, 57, 6, 1573);
    			attr_dev(button0, "class", "svelte-13sqoya");
    			add_location(button0, file$1, 58, 6, 1618);
    			attr_dev(p2, "class", "home-freetrial__smallprint svelte-13sqoya");
    			add_location(p2, file$1, 59, 6, 1711);
    			attr_dev(div0, "class", "home-freetrial__text svelte-13sqoya");
    			add_location(div0, file$1, 55, 4, 1488);
    			attr_dev(div1, "class", "carousel-container svelte-13sqoya");
    			add_location(div1, file$1, 66, 8, 2052);
    			attr_dev(div2, "class", "carousel_image svelte-13sqoya");
    			add_location(div2, file$1, 62, 6, 1848);
    			attr_dev(div3, "class", "home-freetrial__carousel svelte-13sqoya");
    			add_location(div3, file$1, 61, 4, 1803);
    			attr_dev(div4, "class", "wrapper svelte-13sqoya");
    			add_location(div4, file$1, 54, 2, 1462);
    			attr_dev(section1, "class", "home-freetrial svelte-13sqoya");
    			add_location(section1, file$1, 53, 0, 1427);
    			attr_dev(p3, "class", "svelte-13sqoya");
    			add_location(p3, file$1, 79, 2, 2511);
    			attr_dev(button1, "class", "svelte-13sqoya");
    			add_location(button1, file$1, 80, 2, 2545);
    			attr_dev(section2, "class", "blurb svelte-13sqoya");
    			add_location(section2, file$1, 78, 0, 2485);
    			attr_dev(h3, "class", "svelte-13sqoya");
    			add_location(h3, file$1, 84, 2, 2673);
    			attr_dev(div5, "class", "usp-wrapper svelte-13sqoya");
    			add_location(div5, file$1, 85, 2, 2708);
    			attr_dev(section3, "class", "help svelte-13sqoya");
    			add_location(section3, file$1, 83, 0, 2648);
    			attr_dev(img, "class", "mock-up svelte-13sqoya");
    			if (img.src !== (img_src_value = "images/anatomy.png")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Anatomy of the Lemmi app");
    			add_location(img, file$1, 99, 4, 3118);
    			attr_dev(div6, "class", "anatomy-wrapper svelte-13sqoya");
    			add_location(div6, file$1, 100, 4, 3200);
    			attr_dev(div7, "class", "wrapper svelte-13sqoya");
    			add_location(div7, file$1, 98, 2, 3092);
    			attr_dev(section4, "class", "anatomy svelte-13sqoya");
    			add_location(section4, file$1, 97, 0, 3064);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section0, anchor);
    			append_dev(section0, h20);
    			append_dev(h20, t0);
    			append_dev(section0, t1);
    			append_dev(section0, p0);
    			append_dev(p0, t2);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, section1, anchor);
    			append_dev(section1, div4);
    			append_dev(div4, div0);
    			append_dev(div0, h21);
    			append_dev(h21, t4);
    			append_dev(div0, t5);
    			append_dev(div0, p1);
    			append_dev(p1, t6);
    			append_dev(div0, t7);
    			append_dev(div0, button0);
    			append_dev(div0, t9);
    			append_dev(div0, p2);
    			append_dev(p2, t10);
    			append_dev(div4, t11);
    			append_dev(div4, div3);
    			append_dev(div3, div2);
    			append_dev(div2, div1);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].m(div1, null);
    			}

    			/*div1_binding*/ ctx[3](div1);
    			insert_dev(target, t12, anchor);
    			insert_dev(target, section2, anchor);
    			append_dev(section2, p3);
    			append_dev(p3, t13);
    			append_dev(section2, t14);
    			append_dev(section2, button1);
    			append_dev(button1, t15);
    			insert_dev(target, t16, anchor);
    			insert_dev(target, section3, anchor);
    			append_dev(section3, h3);
    			append_dev(h3, t17);
    			append_dev(section3, t18);
    			append_dev(section3, div5);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div5, null);
    			}

    			insert_dev(target, t19, anchor);
    			insert_dev(target, section4, anchor);
    			append_dev(section4, div7);
    			append_dev(div7, img);
    			append_dev(div7, t20);
    			append_dev(div7, div6);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div6, null);
    			}

    			if (!mounted) {
    				dispose = [
    					listen_dev(
    						button0,
    						"click",
    						function () {
    							if (is_function(/*handleClickNavigation*/ ctx[0](pages.pricing, true))) /*handleClickNavigation*/ ctx[0](pages.pricing, true).apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(
    						button1,
    						"click",
    						function () {
    							if (is_function(/*handleClickNavigation*/ ctx[0](pages.app))) /*handleClickNavigation*/ ctx[0](pages.app).apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			if (dirty & /*$_*/ 4 && t0_value !== (t0_value = /*$_*/ ctx[2]("home.intro.text1") + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*$_*/ 4 && t2_value !== (t2_value = /*$_*/ ctx[2]("home.intro.text2") + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*$_*/ 4 && t4_value !== (t4_value = /*$_*/ ctx[2]("home.freetrial.title") + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*$_*/ 4 && t6_value !== (t6_value = /*$_*/ ctx[2]("home.freetrial.subtitle") + "")) set_data_dev(t6, t6_value);
    			if (dirty & /*$_*/ 4 && t10_value !== (t10_value = /*$_*/ ctx[2]("home.freetrial.description") + "")) set_data_dev(t10, t10_value);

    			if (dirty & /*$_*/ 4) {
    				each_value_2 = /*$_*/ ctx[2]("home.freetrial.images");
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks_2[i]) {
    						each_blocks_2[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_2[i] = create_each_block_2(child_ctx);
    						each_blocks_2[i].c();
    						each_blocks_2[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks_2.length; i += 1) {
    					each_blocks_2[i].d(1);
    				}

    				each_blocks_2.length = each_value_2.length;
    			}

    			if (dirty & /*$_*/ 4 && t13_value !== (t13_value = /*$_*/ ctx[2]("home.blurb.text1") + "")) set_data_dev(t13, t13_value);
    			if (dirty & /*$_*/ 4 && t15_value !== (t15_value = /*$_*/ ctx[2]("home.blurb.action") + "")) set_data_dev(t15, t15_value);
    			if (dirty & /*$_*/ 4 && t17_value !== (t17_value = /*$_*/ ctx[2]("home.help.title") + "")) set_data_dev(t17, t17_value);

    			if (dirty & /*$_*/ 4) {
    				each_value_1 = /*$_*/ ctx[2]("home.help.usps");
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$1(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1$1(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div5, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*$_*/ 4) {
    				each_value = /*$_*/ ctx[2]("home.anatomy");
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div6, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(section1);
    			destroy_each(each_blocks_2, detaching);
    			/*div1_binding*/ ctx[3](null);
    			if (detaching) detach_dev(t12);
    			if (detaching) detach_dev(section2);
    			if (detaching) detach_dev(t16);
    			if (detaching) detach_dev(section3);
    			destroy_each(each_blocks_1, detaching);
    			if (detaching) detach_dev(t19);
    			if (detaching) detach_dev(section4);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const speed = 4;

    function instance$1($$self, $$props, $$invalidate) {
    	let $_;
    	validate_store(te, "_");
    	component_subscribe($$self, te, $$value => $$invalidate(2, $_ = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Home", slots, []);
    	let carousel;
    	let carouselIndex = 0;
    	let timeoutId;
    	const numberOfImages = $_("home.freetrial.images").length;
    	let carouselItemWidth;

    	onMount(() => {
    		carouselItemWidth = carousel.scrollWidth / numberOfImages;

    		setInterval(
    			() => {
    				timeoutId = setTimeout(
    					() => {
    						carouselIndex = carouselIndex % numberOfImages;
    						moveCarouselImage();
    						clearTimeout(timeoutId);
    					},
    					1000
    				);
    			},
    			speed * 1000
    		);
    	});

    	const moveCarouselImage = () => {
    		carousel.scrollBy(carouselItemWidth, 0);
    		let childToMove = carousel.querySelectorAll(`.carousel-item`)[carouselIndex];

    		// The line below move the item to end of carousel by 
    		// manipulating its flex order
    		childToMove.style.order = childToMove.style.order && childToMove.style.order === 0
    		? 1
    		: +childToMove.style.order + 1;

    		carouselIndex++;
    	};

    	let { handleClickNavigation } = $$props;
    	const writable_props = ["handleClickNavigation"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Home> was created with unknown prop '${key}'`);
    	});

    	function div1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			carousel = $$value;
    			$$invalidate(1, carousel);
    		});
    	}

    	$$self.$$set = $$props => {
    		if ("handleClickNavigation" in $$props) $$invalidate(0, handleClickNavigation = $$props.handleClickNavigation);
    	};

    	$$self.$capture_state = () => ({
    		onMount,
    		_: te,
    		pages,
    		carousel,
    		carouselIndex,
    		timeoutId,
    		speed,
    		numberOfImages,
    		carouselItemWidth,
    		moveCarouselImage,
    		handleClickNavigation,
    		$_
    	});

    	$$self.$inject_state = $$props => {
    		if ("carousel" in $$props) $$invalidate(1, carousel = $$props.carousel);
    		if ("carouselIndex" in $$props) carouselIndex = $$props.carouselIndex;
    		if ("timeoutId" in $$props) timeoutId = $$props.timeoutId;
    		if ("carouselItemWidth" in $$props) carouselItemWidth = $$props.carouselItemWidth;
    		if ("handleClickNavigation" in $$props) $$invalidate(0, handleClickNavigation = $$props.handleClickNavigation);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [handleClickNavigation, carousel, $_, div1_binding];
    }

    class Home extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, { handleClickNavigation: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Home",
    			options,
    			id: create_fragment$1.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*handleClickNavigation*/ ctx[0] === undefined && !("handleClickNavigation" in props)) {
    			console.warn("<Home> was created without expected prop 'handleClickNavigation'");
    		}
    	}

    	get handleClickNavigation() {
    		throw new Error("<Home>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set handleClickNavigation(value) {
    		throw new Error("<Home>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/pages/Lemmi.svelte generated by Svelte v3.29.0 */
    const file$2 = "src/pages/Lemmi.svelte";

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i].title;
    	child_ctx[2] = list[i].description;
    	child_ctx[3] = list[i].image;
    	child_ctx[5] = i;
    	return child_ctx;
    }

    // (9:2) {#each $_('app.features') as { title, description, image }
    function create_each_block$2(ctx) {
    	let div1;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t0;
    	let div0;
    	let h3;
    	let t1_value = /*title*/ ctx[1] + "";
    	let t1;
    	let t2;
    	let p;
    	let t3_value = /*description*/ ctx[2] + "";
    	let t3;
    	let t4;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			img = element("img");
    			t0 = space();
    			div0 = element("div");
    			h3 = element("h3");
    			t1 = text(t1_value);
    			t2 = space();
    			p = element("p");
    			t3 = text(t3_value);
    			t4 = space();
    			attr_dev(img, "class", "feature-image svelte-19ypr86");
    			if (img.src !== (img_src_value = /*image*/ ctx[3])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = "" + (/*title*/ ctx[1] + " image"));
    			add_location(img, file$2, 10, 6, 295);
    			attr_dev(h3, "class", "feature-title svelte-19ypr86");
    			add_location(h3, file$2, 15, 8, 422);
    			attr_dev(p, "class", "feature-description svelte-19ypr86");
    			add_location(p, file$2, 16, 8, 469);
    			attr_dev(div0, "class", "text-wrapper svelte-19ypr86");
    			add_location(div0, file$2, 14, 6, 387);
    			attr_dev(div1, "class", "feature svelte-19ypr86");
    			toggle_class(div1, "right", /*index*/ ctx[5] % 2 !== 0);
    			add_location(div1, file$2, 9, 4, 237);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, img);
    			append_dev(div1, t0);
    			append_dev(div1, div0);
    			append_dev(div0, h3);
    			append_dev(h3, t1);
    			append_dev(div0, t2);
    			append_dev(div0, p);
    			append_dev(p, t3);
    			append_dev(div1, t4);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$_*/ 1 && img.src !== (img_src_value = /*image*/ ctx[3])) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*$_*/ 1 && img_alt_value !== (img_alt_value = "" + (/*title*/ ctx[1] + " image"))) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (dirty & /*$_*/ 1 && t1_value !== (t1_value = /*title*/ ctx[1] + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*$_*/ 1 && t3_value !== (t3_value = /*description*/ ctx[2] + "")) set_data_dev(t3, t3_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(9:2) {#each $_('app.features') as { title, description, image }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div;
    	let h3;
    	let t0_value = /*$_*/ ctx[0]("app.header").toUpperCase() + "";
    	let t0;
    	let t1;
    	let section;
    	let each_value = /*$_*/ ctx[0]("app.features");
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			h3 = element("h3");
    			t0 = text(t0_value);
    			t1 = space();
    			section = element("section");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(h3, "class", "svelte-19ypr86");
    			add_location(h3, file$2, 5, 2, 88);
    			attr_dev(div, "class", "lemmi-title svelte-19ypr86");
    			add_location(div, file$2, 4, 0, 60);
    			attr_dev(section, "class", "features svelte-19ypr86");
    			add_location(section, file$2, 7, 0, 137);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h3);
    			append_dev(h3, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, section, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(section, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$_*/ 1 && t0_value !== (t0_value = /*$_*/ ctx[0]("app.header").toUpperCase() + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*$_*/ 1) {
    				each_value = /*$_*/ ctx[0]("app.features");
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$2(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$2(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(section, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(section);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $_;
    	validate_store(te, "_");
    	component_subscribe($$self, te, $$value => $$invalidate(0, $_ = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Lemmi", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Lemmi> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ _: te, $_ });
    	return [$_];
    }

    class Lemmi extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Lemmi",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/pages/About.svelte generated by Svelte v3.29.0 */
    const file$3 = "src/pages/About.svelte";

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    // (20:6) {#each $_('about.story.timeline') as event}
    function create_each_block_1$2(ctx) {
    	let div2;
    	let div0;
    	let img;
    	let img_src_value;
    	let t0;
    	let div1;
    	let h2;
    	let t1_value = /*event*/ ctx[4].date + "";
    	let t1;
    	let t2;
    	let p;
    	let t3_value = /*event*/ ctx[4].text + "";
    	let t3;
    	let t4;

    	const block = {
    		c: function create() {
    			div2 = element("div");
    			div0 = element("div");
    			img = element("img");
    			t0 = space();
    			div1 = element("div");
    			h2 = element("h2");
    			t1 = text(t1_value);
    			t2 = space();
    			p = element("p");
    			t3 = text(t3_value);
    			t4 = space();
    			if (img.src !== (img_src_value = /*event*/ ctx[4].image)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Timeline icon");
    			attr_dev(img, "class", "svelte-13bnvh8");
    			add_location(img, file$3, 22, 12, 589);
    			attr_dev(div0, "class", "timeline-img svelte-13bnvh8");
    			add_location(div0, file$3, 21, 10, 550);
    			attr_dev(h2, "class", "svelte-13bnvh8");
    			add_location(h2, file$3, 25, 12, 719);
    			add_location(p, file$3, 26, 12, 753);
    			attr_dev(div1, "class", "timeline-content js--fadeInLeft svelte-13bnvh8");
    			add_location(div1, file$3, 24, 10, 661);
    			attr_dev(div2, "class", "timeline-item svelte-13bnvh8");
    			add_location(div2, file$3, 20, 8, 512);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div2, anchor);
    			append_dev(div2, div0);
    			append_dev(div0, img);
    			append_dev(div2, t0);
    			append_dev(div2, div1);
    			append_dev(div1, h2);
    			append_dev(h2, t1);
    			append_dev(div1, t2);
    			append_dev(div1, p);
    			append_dev(p, t3);
    			append_dev(div2, t4);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$_*/ 1 && img.src !== (img_src_value = /*event*/ ctx[4].image)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*$_*/ 1 && t1_value !== (t1_value = /*event*/ ctx[4].date + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*$_*/ 1 && t3_value !== (t3_value = /*event*/ ctx[4].text + "")) set_data_dev(t3, t3_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div2);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$2.name,
    		type: "each",
    		source: "(20:6) {#each $_('about.story.timeline') as event}",
    		ctx
    	});

    	return block;
    }

    // (39:4) {#each $_('about.team.people') as person}
    function create_each_block$3(ctx) {
    	let div;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t0;
    	let h30;
    	let t1_value = /*person*/ ctx[1].name + "";
    	let t1;
    	let t2;
    	let h31;
    	let t3_value = /*person*/ ctx[1].role + "";
    	let t3;
    	let t4;

    	const block = {
    		c: function create() {
    			div = element("div");
    			img = element("img");
    			t0 = space();
    			h30 = element("h3");
    			t1 = text(t1_value);
    			t2 = space();
    			h31 = element("h3");
    			t3 = text(t3_value);
    			t4 = space();
    			if (img.src !== (img_src_value = /*person*/ ctx[1].image)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = `Picture of ${/*person*/ ctx[1].name}`);
    			attr_dev(img, "class", "svelte-13bnvh8");
    			add_location(img, file$3, 40, 8, 1082);
    			attr_dev(h30, "class", "team-name svelte-13bnvh8");
    			add_location(h30, file$3, 41, 8, 1150);
    			attr_dev(h31, "class", "team-role svelte-13bnvh8");
    			add_location(h31, file$3, 42, 8, 1199);
    			attr_dev(div, "class", "team-member svelte-13bnvh8");
    			add_location(div, file$3, 39, 6, 1048);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, img);
    			append_dev(div, t0);
    			append_dev(div, h30);
    			append_dev(h30, t1);
    			append_dev(div, t2);
    			append_dev(div, h31);
    			append_dev(h31, t3);
    			append_dev(div, t4);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$_*/ 1 && img.src !== (img_src_value = /*person*/ ctx[1].image)) {
    				attr_dev(img, "src", img_src_value);
    			}

    			if (dirty & /*$_*/ 1 && img_alt_value !== (img_alt_value = `Picture of ${/*person*/ ctx[1].name}`)) {
    				attr_dev(img, "alt", img_alt_value);
    			}

    			if (dirty & /*$_*/ 1 && t1_value !== (t1_value = /*person*/ ctx[1].name + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*$_*/ 1 && t3_value !== (t3_value = /*person*/ ctx[1].role + "")) set_data_dev(t3, t3_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(39:4) {#each $_('about.team.people') as person}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div0;
    	let h20;
    	let t0_value = /*$_*/ ctx[0]("about.vision.title").toUpperCase() + "";
    	let t0;
    	let t1;
    	let article0;
    	let p;
    	let t2_value = /*$_*/ ctx[0]("about.vision.text") + "";
    	let t2;
    	let t3;
    	let div1;
    	let h21;
    	let t4_value = /*$_*/ ctx[0]("about.story.title").toUpperCase() + "";
    	let t4;
    	let t5;
    	let article1;
    	let section;
    	let div2;
    	let t6;
    	let div3;
    	let h22;
    	let t7_value = /*$_*/ ctx[0]("about.team.title").title.toUpperCase() + "";
    	let t7;
    	let t8;
    	let article2;
    	let div4;
    	let each_value_1 = /*$_*/ ctx[0]("about.story.timeline");
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1$2(get_each_context_1$2(ctx, each_value_1, i));
    	}

    	let each_value = /*$_*/ ctx[0]("about.team.people");
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			h20 = element("h2");
    			t0 = text(t0_value);
    			t1 = space();
    			article0 = element("article");
    			p = element("p");
    			t2 = text(t2_value);
    			t3 = space();
    			div1 = element("div");
    			h21 = element("h2");
    			t4 = text(t4_value);
    			t5 = space();
    			article1 = element("article");
    			section = element("section");
    			div2 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t6 = space();
    			div3 = element("div");
    			h22 = element("h2");
    			t7 = text(t7_value);
    			t8 = space();
    			article2 = element("article");
    			div4 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(h20, file$3, 8, 2, 161);
    			attr_dev(div0, "class", "about-title svelte-13bnvh8");
    			add_location(div0, file$3, 7, 0, 133);
    			add_location(p, file$3, 11, 2, 245);
    			attr_dev(article0, "class", "vision svelte-13bnvh8");
    			add_location(article0, file$3, 10, 0, 218);
    			add_location(h21, file$3, 14, 2, 317);
    			attr_dev(div1, "class", "about-title svelte-13bnvh8");
    			add_location(div1, file$3, 13, 0, 289);
    			attr_dev(div2, "class", "container");
    			add_location(div2, file$3, 18, 4, 430);
    			attr_dev(section, "class", "timeline svelte-13bnvh8");
    			add_location(section, file$3, 17, 2, 399);
    			attr_dev(article1, "class", "story svelte-13bnvh8");
    			add_location(article1, file$3, 16, 0, 373);
    			add_location(h22, file$3, 34, 2, 883);
    			attr_dev(div3, "class", "about-title svelte-13bnvh8");
    			add_location(div3, file$3, 33, 0, 855);
    			attr_dev(div4, "class", "team-wrapper svelte-13bnvh8");
    			add_location(div4, file$3, 37, 2, 969);
    			attr_dev(article2, "class", "team svelte-13bnvh8");
    			add_location(article2, file$3, 36, 0, 944);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, h20);
    			append_dev(h20, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, article0, anchor);
    			append_dev(article0, p);
    			append_dev(p, t2);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h21);
    			append_dev(h21, t4);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, article1, anchor);
    			append_dev(article1, section);
    			append_dev(section, div2);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div2, null);
    			}

    			insert_dev(target, t6, anchor);
    			insert_dev(target, div3, anchor);
    			append_dev(div3, h22);
    			append_dev(h22, t7);
    			insert_dev(target, t8, anchor);
    			insert_dev(target, article2, anchor);
    			append_dev(article2, div4);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div4, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$_*/ 1 && t0_value !== (t0_value = /*$_*/ ctx[0]("about.vision.title").toUpperCase() + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*$_*/ 1 && t2_value !== (t2_value = /*$_*/ ctx[0]("about.vision.text") + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*$_*/ 1 && t4_value !== (t4_value = /*$_*/ ctx[0]("about.story.title").toUpperCase() + "")) set_data_dev(t4, t4_value);

    			if (dirty & /*$_*/ 1) {
    				each_value_1 = /*$_*/ ctx[0]("about.story.timeline");
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$2(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1$2(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div2, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*$_*/ 1 && t7_value !== (t7_value = /*$_*/ ctx[0]("about.team.title").title.toUpperCase() + "")) set_data_dev(t7, t7_value);

    			if (dirty & /*$_*/ 1) {
    				each_value = /*$_*/ ctx[0]("about.team.people");
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div4, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(article0);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(article1);
    			destroy_each(each_blocks_1, detaching);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(div3);
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(article2);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $_;
    	validate_store(te, "_");
    	component_subscribe($$self, te, $$value => $$invalidate(0, $_ = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("About", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<About> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ _: te, $_ });
    	return [$_];
    }

    class About extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "About",
    			options,
    			id: create_fragment$3.name
    		});
    	}
    }

    /* src/pages/Pricing.svelte generated by Svelte v3.29.0 */

    const { console: console_1 } = globals;
    const file$4 = "src/pages/Pricing.svelte";

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[4] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    // (21:8) {#if plan.popular}
    function create_if_block_2(ctx) {
    	let h3;
    	let t_value = /*plan*/ ctx[7].popular + "";
    	let t;

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			t = text(t_value);
    			attr_dev(h3, "class", "popular svelte-1dqfil0");
    			add_location(h3, file$4, 21, 10, 481);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			append_dev(h3, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$_*/ 1 && t_value !== (t_value = /*plan*/ ctx[7].popular + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(21:8) {#if plan.popular}",
    		ctx
    	});

    	return block;
    }

    // (26:8) {#if plan.perMonth}
    function create_if_block_1(ctx) {
    	let p;
    	let t_value = /*plan*/ ctx[7].perMonth + "";
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(t_value);
    			attr_dev(p, "class", "perMonth svelte-1dqfil0");
    			add_location(p, file$4, 26, 10, 661);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$_*/ 1 && t_value !== (t_value = /*plan*/ ctx[7].perMonth + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(26:8) {#if plan.perMonth}",
    		ctx
    	});

    	return block;
    }

    // (30:8) {#if plan.save}
    function create_if_block(ctx) {
    	let h5;
    	let t_value = /*plan*/ ctx[7].save.toUpperCase() + "";
    	let t;

    	const block = {
    		c: function create() {
    			h5 = element("h5");
    			t = text(t_value);
    			attr_dev(h5, "class", "saving svelte-1dqfil0");
    			add_location(h5, file$4, 30, 10, 804);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h5, anchor);
    			append_dev(h5, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$_*/ 1 && t_value !== (t_value = /*plan*/ ctx[7].save.toUpperCase() + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h5);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(30:8) {#if plan.save}",
    		ctx
    	});

    	return block;
    }

    // (19:4) {#each $_('pricing.plans') as plan}
    function create_each_block_1$3(ctx) {
    	let div;
    	let t0;
    	let h1;
    	let t1_value = /*plan*/ ctx[7].title + "";
    	let t1;
    	let t2;
    	let h2;
    	let t3_value = /*plan*/ ctx[7].price + "";
    	let t3;
    	let t4;
    	let t5;
    	let p;
    	let t6_value = /*$_*/ ctx[0]("pricing.billing") + "";
    	let t6;
    	let t7;
    	let t8;
    	let if_block0 = /*plan*/ ctx[7].popular && create_if_block_2(ctx);
    	let if_block1 = /*plan*/ ctx[7].perMonth && create_if_block_1(ctx);
    	let if_block2 = /*plan*/ ctx[7].save && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			h1 = element("h1");
    			t1 = text(t1_value);
    			t2 = space();
    			h2 = element("h2");
    			t3 = text(t3_value);
    			t4 = space();
    			if (if_block1) if_block1.c();
    			t5 = space();
    			p = element("p");
    			t6 = text(t6_value);
    			t7 = space();
    			if (if_block2) if_block2.c();
    			t8 = space();
    			attr_dev(h1, "class", "title svelte-1dqfil0");
    			add_location(h1, file$4, 23, 8, 543);
    			attr_dev(h2, "class", "price svelte-1dqfil0");
    			add_location(h2, file$4, 24, 8, 587);
    			attr_dev(p, "class", "billing svelte-1dqfil0");
    			add_location(p, file$4, 28, 8, 723);
    			attr_dev(div, "class", "plan svelte-1dqfil0");
    			add_location(div, file$4, 19, 6, 425);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			if (if_block0) if_block0.m(div, null);
    			append_dev(div, t0);
    			append_dev(div, h1);
    			append_dev(h1, t1);
    			append_dev(div, t2);
    			append_dev(div, h2);
    			append_dev(h2, t3);
    			append_dev(div, t4);
    			if (if_block1) if_block1.m(div, null);
    			append_dev(div, t5);
    			append_dev(div, p);
    			append_dev(p, t6);
    			append_dev(div, t7);
    			if (if_block2) if_block2.m(div, null);
    			append_dev(div, t8);
    		},
    		p: function update(ctx, dirty) {
    			if (/*plan*/ ctx[7].popular) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_2(ctx);
    					if_block0.c();
    					if_block0.m(div, t0);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (dirty & /*$_*/ 1 && t1_value !== (t1_value = /*plan*/ ctx[7].title + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*$_*/ 1 && t3_value !== (t3_value = /*plan*/ ctx[7].price + "")) set_data_dev(t3, t3_value);

    			if (/*plan*/ ctx[7].perMonth) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block_1(ctx);
    					if_block1.c();
    					if_block1.m(div, t5);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (dirty & /*$_*/ 1 && t6_value !== (t6_value = /*$_*/ ctx[0]("pricing.billing") + "")) set_data_dev(t6, t6_value);

    			if (/*plan*/ ctx[7].save) {
    				if (if_block2) {
    					if_block2.p(ctx, dirty);
    				} else {
    					if_block2 = create_if_block(ctx);
    					if_block2.c();
    					if_block2.m(div, t8);
    				}
    			} else if (if_block2) {
    				if_block2.d(1);
    				if_block2 = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			if (if_block2) if_block2.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$3.name,
    		type: "each",
    		source: "(19:4) {#each $_('pricing.plans') as plan}",
    		ctx
    	});

    	return block;
    }

    // (38:4) {#each $_('pricing.included') as included}
    function create_each_block$4(ctx) {
    	let p;
    	let t_value = /*included*/ ctx[4] + "";
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(t_value);
    			attr_dev(p, "class", "svelte-1dqfil0");
    			add_location(p, file$4, 38, 6, 1023);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$_*/ 1 && t_value !== (t_value = /*included*/ ctx[4] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$4.name,
    		type: "each",
    		source: "(38:4) {#each $_('pricing.included') as included}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div0;
    	let h20;
    	let t0_value = /*$_*/ ctx[0]("pricing.title").toUpperCase() + "";
    	let t0;
    	let t1;
    	let section;
    	let h21;
    	let t2_value = /*$_*/ ctx[0]("pricing.subscription") + "";
    	let t2;
    	let t3;
    	let div1;
    	let t4;
    	let div2;
    	let h22;
    	let t5_value = /*$_*/ ctx[0]("pricing.whatsIncluded") + "";
    	let t5;
    	let t6;
    	let t7;
    	let h4;
    	let t8_value = /*$_*/ ctx[0]("pricing.available") + "";
    	let t8;
    	let t9;
    	let div3;
    	let button0;
    	let img0;
    	let img0_src_value;
    	let t10;
    	let button1;
    	let img1;
    	let img1_src_value;
    	let mounted;
    	let dispose;
    	let each_value_1 = /*$_*/ ctx[0]("pricing.plans");
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1$3(get_each_context_1$3(ctx, each_value_1, i));
    	}

    	let each_value = /*$_*/ ctx[0]("pricing.included");
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			h20 = element("h2");
    			t0 = text(t0_value);
    			t1 = space();
    			section = element("section");
    			h21 = element("h2");
    			t2 = text(t2_value);
    			t3 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t4 = space();
    			div2 = element("div");
    			h22 = element("h2");
    			t5 = text(t5_value);
    			t6 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t7 = space();
    			h4 = element("h4");
    			t8 = text(t8_value);
    			t9 = space();
    			div3 = element("div");
    			button0 = element("button");
    			img0 = element("img");
    			t10 = space();
    			button1 = element("button");
    			img1 = element("img");
    			add_location(h20, file$4, 13, 2, 225);
    			attr_dev(div0, "class", "pricing-title svelte-1dqfil0");
    			add_location(div0, file$4, 12, 0, 195);
    			attr_dev(h21, "class", "svelte-1dqfil0");
    			add_location(h21, file$4, 16, 2, 311);
    			attr_dev(div1, "class", "plans-wrapper svelte-1dqfil0");
    			add_location(div1, file$4, 17, 2, 351);
    			attr_dev(h22, "class", "svelte-1dqfil0");
    			add_location(h22, file$4, 36, 4, 931);
    			attr_dev(div2, "class", "included svelte-1dqfil0");
    			add_location(div2, file$4, 35, 2, 904);
    			attr_dev(h4, "class", "svelte-1dqfil0");
    			add_location(h4, file$4, 41, 2, 1064);
    			attr_dev(img0, "class", "app-icon svelte-1dqfil0");
    			if (img0.src !== (img0_src_value = "images/app-store.png")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "Download on the App Store");
    			add_location(img0, file$4, 46, 6, 1191);
    			attr_dev(button0, "class", "svelte-1dqfil0");
    			add_location(button0, file$4, 43, 4, 1131);
    			attr_dev(img1, "class", "play-icon svelte-1dqfil0");
    			if (img1.src !== (img1_src_value = "images/play-store.png")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "Download on the Play Store");
    			add_location(img1, file$4, 54, 6, 1378);
    			attr_dev(button1, "class", "svelte-1dqfil0");
    			add_location(button1, file$4, 51, 4, 1317);
    			attr_dev(div3, "class", "store-icons svelte-1dqfil0");
    			add_location(div3, file$4, 42, 2, 1101);
    			attr_dev(section, "class", "subscriptions svelte-1dqfil0");
    			add_location(section, file$4, 15, 0, 277);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, h20);
    			append_dev(h20, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, section, anchor);
    			append_dev(section, h21);
    			append_dev(h21, t2);
    			append_dev(section, t3);
    			append_dev(section, div1);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div1, null);
    			}

    			append_dev(section, t4);
    			append_dev(section, div2);
    			append_dev(div2, h22);
    			append_dev(h22, t5);
    			append_dev(div2, t6);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div2, null);
    			}

    			append_dev(section, t7);
    			append_dev(section, h4);
    			append_dev(h4, t8);
    			append_dev(section, t9);
    			append_dev(section, div3);
    			append_dev(div3, button0);
    			append_dev(button0, img0);
    			append_dev(div3, t10);
    			append_dev(div3, button1);
    			append_dev(button1, img1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[2], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[3], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$_*/ 1 && t0_value !== (t0_value = /*$_*/ ctx[0]("pricing.title").toUpperCase() + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*$_*/ 1 && t2_value !== (t2_value = /*$_*/ ctx[0]("pricing.subscription") + "")) set_data_dev(t2, t2_value);

    			if (dirty & /*$_*/ 1) {
    				each_value_1 = /*$_*/ ctx[0]("pricing.plans");
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$3(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1$3(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*$_*/ 1 && t5_value !== (t5_value = /*$_*/ ctx[0]("pricing.whatsIncluded") + "")) set_data_dev(t5, t5_value);

    			if (dirty & /*$_*/ 1) {
    				each_value = /*$_*/ ctx[0]("pricing.included");
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$4(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$4(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div2, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*$_*/ 1 && t8_value !== (t8_value = /*$_*/ ctx[0]("pricing.available") + "")) set_data_dev(t8, t8_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(section);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$4($$self, $$props, $$invalidate) {
    	let $_;
    	validate_store(te, "_");
    	component_subscribe($$self, te, $$value => $$invalidate(0, $_ = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Pricing", slots, []);

    	const openStore = store => {
    		if (store === "app") {
    			console.log("app");
    		} else {
    			console.log("play");
    		}
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Pricing> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => openStore("app");
    	const click_handler_1 = () => openStore("play");
    	$$self.$capture_state = () => ({ _: te, openStore, $_ });
    	return [$_, openStore, click_handler, click_handler_1];
    }

    class Pricing extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Pricing",
    			options,
    			id: create_fragment$4.name
    		});
    	}
    }

    /* src/pages/FAQs.svelte generated by Svelte v3.29.0 */

    const file$5 = "src/pages/FAQs.svelte";

    function create_fragment$5(ctx) {
    	let div0;
    	let h2;
    	let t1;
    	let section0;
    	let h30;
    	let t3;
    	let details0;
    	let summary0;
    	let t5;
    	let div1;
    	let p0;
    	let t7;
    	let p1;
    	let t9;
    	let p2;
    	let t11;
    	let details1;
    	let summary1;
    	let t13;
    	let div5;
    	let div2;
    	let img0;
    	let img0_src_value;
    	let t14;
    	let p3;
    	let t16;
    	let div3;
    	let img1;
    	let img1_src_value;
    	let t17;
    	let p4;
    	let t19;
    	let div4;
    	let img2;
    	let img2_src_value;
    	let t20;
    	let p5;
    	let t22;
    	let details2;
    	let summary2;
    	let t24;
    	let div8;
    	let div7;
    	let img3;
    	let img3_src_value;
    	let t25;
    	let div6;
    	let p6;
    	let t27;
    	let p7;
    	let t29;
    	let p8;
    	let t31;
    	let details3;
    	let summary3;
    	let t33;
    	let div10;
    	let div9;
    	let img4;
    	let img4_src_value;
    	let t34;
    	let p9;
    	let t36;
    	let details4;
    	let summary4;
    	let t38;
    	let div13;
    	let div12;
    	let img5;
    	let img5_src_value;
    	let t39;
    	let div11;
    	let p10;
    	let t41;
    	let p11;
    	let t43;
    	let details5;
    	let summary5;
    	let t45;
    	let div16;
    	let div15;
    	let img6;
    	let img6_src_value;
    	let t46;
    	let div14;
    	let p12;
    	let t48;
    	let p13;
    	let t50;
    	let section1;
    	let h31;
    	let t52;
    	let details6;
    	let summary6;
    	let t54;
    	let div20;
    	let div17;
    	let img7;
    	let img7_src_value;
    	let t55;
    	let p14;
    	let t57;
    	let div19;
    	let img8;
    	let img8_src_value;
    	let t58;
    	let div18;
    	let p15;
    	let t60;
    	let p16;
    	let t62;
    	let p17;
    	let t64;
    	let p18;
    	let t65;
    	let a0;
    	let t67;
    	let details7;
    	let summary7;
    	let t69;
    	let div24;
    	let div21;
    	let img9;
    	let img9_src_value;
    	let t70;
    	let p19;
    	let t72;
    	let div23;
    	let img10;
    	let img10_src_value;
    	let t73;
    	let div22;
    	let p20;
    	let t75;
    	let p21;
    	let t77;
    	let p22;
    	let t79;
    	let details8;
    	let summary8;
    	let t81;
    	let div25;
    	let p23;
    	let t83;
    	let p24;
    	let t85;
    	let details9;
    	let summary9;
    	let t87;
    	let div28;
    	let div27;
    	let img11;
    	let img11_src_value;
    	let t88;
    	let div26;
    	let p25;
    	let t90;
    	let p26;
    	let t92;
    	let p27;
    	let t94;
    	let details10;
    	let summary10;
    	let t96;
    	let div29;
    	let p28;
    	let t98;
    	let p29;
    	let t100;
    	let details11;
    	let summary11;
    	let t102;
    	let div32;
    	let div31;
    	let img12;
    	let img12_src_value;
    	let t103;
    	let div30;
    	let p30;
    	let t105;
    	let p31;
    	let t107;
    	let p32;
    	let t109;
    	let details12;
    	let summary12;
    	let t111;
    	let div34;
    	let div33;
    	let img13;
    	let img13_src_value;
    	let t112;
    	let p33;
    	let t114;
    	let details13;
    	let summary13;
    	let t116;
    	let div36;
    	let div35;
    	let img14;
    	let img14_src_value;
    	let t117;
    	let p34;
    	let t119;
    	let details14;
    	let summary14;
    	let t121;
    	let div38;
    	let div37;
    	let img15;
    	let img15_src_value;
    	let t122;
    	let p35;
    	let t124;
    	let section2;
    	let h32;
    	let t126;
    	let details15;
    	let summary15;
    	let t128;
    	let div40;
    	let p36;
    	let t130;
    	let div39;
    	let p37;
    	let b0;
    	let t132;
    	let p38;
    	let b1;
    	let t134;
    	let p39;
    	let t136;
    	let details16;
    	let summary16;
    	let t138;
    	let div41;
    	let p40;
    	let t139;
    	let a1;
    	let t141;
    	let t142;
    	let details17;
    	let summary17;
    	let t144;
    	let div44;
    	let p41;
    	let t146;
    	let div43;
    	let img16;
    	let img16_src_value;
    	let t147;
    	let div42;
    	let p42;
    	let t149;
    	let p43;
    	let t151;
    	let p44;
    	let t153;
    	let p45;
    	let t154;
    	let a2;
    	let t156;
    	let t157;
    	let details18;
    	let summary18;
    	let t159;
    	let div45;
    	let p46;
    	let t161;
    	let details19;
    	let summary19;
    	let t163;
    	let div46;
    	let p47;
    	let t164;
    	let a3;
    	let t166;
    	let a4;
    	let t168;
    	let t169;
    	let section3;
    	let h33;
    	let t171;
    	let details20;
    	let summary20;
    	let t173;
    	let div49;
    	let div48;
    	let img17;
    	let img17_src_value;
    	let t174;
    	let div47;
    	let p48;
    	let t176;
    	let p49;
    	let t178;
    	let p50;
    	let t180;
    	let details21;
    	let summary21;
    	let t182;
    	let div50;
    	let p51;
    	let t183;
    	let a5;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			h2 = element("h2");
    			h2.textContent = "FAQs";
    			t1 = space();
    			section0 = element("section");
    			h30 = element("h3");
    			h30.textContent = "1. Using Lemmi";
    			t3 = space();
    			details0 = element("details");
    			summary0 = element("summary");
    			summary0.textContent = "How does Lemmi work?";
    			t5 = space();
    			div1 = element("div");
    			p0 = element("p");
    			p0.textContent = "Choose words or phrases from a range of different Categories.";
    			t7 = space();
    			p1 = element("p");
    			p1.textContent = "Selected words and phrases will appear in the Speech Bar at the top of the screen. By default, Lemmi will read this aloud right away.";
    			t9 = space();
    			p2 = element("p");
    			p2.textContent = "To repeat the selected text tap the ‘Play’ button beneath the Speech Bar.";
    			t11 = space();
    			details1 = element("details");
    			summary1 = element("summary");
    			summary1.textContent = "What do the Speech Bar buttons do?";
    			t13 = space();
    			div5 = element("div");
    			div2 = element("div");
    			img0 = element("img");
    			t14 = space();
    			p3 = element("p");
    			p3.textContent = "Clear: Clears the text in the Speech Bar";
    			t16 = space();
    			div3 = element("div");
    			img1 = element("img");
    			t17 = space();
    			p4 = element("p");
    			p4.textContent = "Undo: Undo clears the last text that was added to the Speech Bar";
    			t19 = space();
    			div4 = element("div");
    			img2 = element("img");
    			t20 = space();
    			p5 = element("p");
    			p5.textContent = "Play: Plays the text in the Speech Bar";
    			t22 = space();
    			details2 = element("details");
    			summary2 = element("summary");
    			summary2.textContent = "How do I access Core Words?";
    			t24 = space();
    			div8 = element("div");
    			div7 = element("div");
    			img3 = element("img");
    			t25 = space();
    			div6 = element("div");
    			p6 = element("p");
    			p6.textContent = "Tap on the Core Words button in the bottom menu of the app’s home page.";
    			t27 = space();
    			p7 = element("p");
    			p7.textContent = "Scroll down on the Core Words window to view all available options.";
    			t29 = space();
    			p8 = element("p");
    			p8.textContent = "To close: Tap anywhere outside of the Core Words window.";
    			t31 = space();
    			details3 = element("details");
    			summary3 = element("summary");
    			summary3.textContent = "How do I access Categories?";
    			t33 = space();
    			div10 = element("div");
    			div9 = element("div");
    			img4 = element("img");
    			t34 = space();
    			p9 = element("p");
    			p9.textContent = "Tap on the Dictionary button and tap on your chosen category.";
    			t36 = space();
    			details4 = element("details");
    			summary4 = element("summary");
    			summary4.textContent = "How do I access Settings?";
    			t38 = space();
    			div13 = element("div");
    			div12 = element("div");
    			img5 = element("img");
    			t39 = space();
    			div11 = element("div");
    			p10 = element("p");
    			p10.textContent = "Tap on the Settings button.";
    			t41 = space();
    			p11 = element("p");
    			p11.textContent = "Here you can adjust a range of settings that will automatically update.";
    			t43 = space();
    			details5 = element("details");
    			summary5 = element("summary");
    			summary5.textContent = "How do I Sign Out? (Android only)";
    			t45 = space();
    			div16 = element("div");
    			div15 = element("div");
    			img6 = element("img");
    			t46 = space();
    			div14 = element("div");
    			p12 = element("p");
    			p12.textContent = "Tap on the Settings button.";
    			t48 = space();
    			p13 = element("p");
    			p13.textContent = "On the Settings screen, scroll to the bottom and tap 'Sign Out'.";
    			t50 = space();
    			section1 = element("section");
    			h31 = element("h3");
    			h31.textContent = "2. Customisation";
    			t52 = space();
    			details6 = element("details");
    			summary6 = element("summary");
    			summary6.textContent = "How do I add custom entry words and images?";
    			t54 = space();
    			div20 = element("div");
    			div17 = element("div");
    			img7 = element("img");
    			t55 = space();
    			p14 = element("p");
    			p14.textContent = "Tap on the Dictionary button.";
    			t57 = space();
    			div19 = element("div");
    			img8 = element("img");
    			t58 = space();
    			div18 = element("div");
    			p15 = element("p");
    			p15.textContent = "Tap 'Add Entry'.";
    			t60 = space();
    			p16 = element("p");
    			p16.textContent = "On this new screen, enter your text, select the category you want your entry to be stored in, and, optionally, choose an image.";
    			t62 = space();
    			p17 = element("p");
    			p17.textContent = "Tap 'Save'.";
    			t64 = space();
    			p18 = element("p");
    			t65 = text("Note: You mustupload content that is yours, or that have been granted the right to use. For more information please see our ");
    			a0 = element("a");
    			a0.textContent = "Terms of Service.";
    			t67 = space();
    			details7 = element("details");
    			summary7 = element("summary");
    			summary7.textContent = "How do I edit or delete custom entry words and images?";
    			t69 = space();
    			div24 = element("div");
    			div21 = element("div");
    			img9 = element("img");
    			t70 = space();
    			p19 = element("p");
    			p19.textContent = "Tap on the Dictionary button.";
    			t72 = space();
    			div23 = element("div");
    			img10 = element("img");
    			t73 = space();
    			div22 = element("div");
    			p20 = element("p");
    			p20.textContent = "Tap on the Word Book button.";
    			t75 = space();
    			p21 = element("p");
    			p21.textContent = "To edit: tap 'Edit' on the entry you want to change. Update the text, category or image, and tap to confirm.";
    			t77 = space();
    			p22 = element("p");
    			p22.textContent = "To delete: tap 'Delete' on the entry you want to delete and tap to confirm.";
    			t79 = space();
    			details8 = element("details");
    			summary8 = element("summary");
    			summary8.textContent = "Are my custom entries safe?";
    			t81 = space();
    			div25 = element("div");
    			p23 = element("p");
    			p23.textContent = "Yes, your custom entries are stored to your personal account. We do not have access to this, nor do we collect or store any of this information.";
    			t83 = space();
    			p24 = element("p");
    			p24.textContent = "Note: for Android users, or those using Lemmi without syncing to iCloud, you will lose any custom data if you delete the app from your device.";
    			t85 = space();
    			details9 = element("details");
    			summary9 = element("summary");
    			summary9.textContent = "How do I change the speaking voice?";
    			t87 = space();
    			div28 = element("div");
    			div27 = element("div");
    			img11 = element("img");
    			t88 = space();
    			div26 = element("div");
    			p25 = element("p");
    			p25.textContent = "Tap on the Settings button.";
    			t90 = space();
    			p26 = element("p");
    			p26.textContent = "Tap on the voice dropdown menu and tap to select a voice.";
    			t92 = space();
    			p27 = element("p");
    			p27.textContent = "To hear a sample voice please tap the 'Play'.";
    			t94 = space();
    			details10 = element("details");
    			summary10 = element("summary");
    			summary10.textContent = "How do I add alternative voices?";
    			t96 = space();
    			div29 = element("div");
    			p28 = element("p");
    			p28.textContent = "For iOS: Go to your device's Settings menu. Select 'Accessibility', then 'Spoken Content' and tap 'Voices'. We recommend using voices marked 'Enhanced'.";
    			t98 = space();
    			p29 = element("p");
    			p29.textContent = "For Android: Go to your device's Settings. Select Accessibility, then tap the 'Preferred Engine Settings' symbol and tap 'Install Voice Data'.";
    			t100 = space();
    			details11 = element("details");
    			summary11 = element("summary");
    			summary11.textContent = "How do I change the app's colour scheme?";
    			t102 = space();
    			div32 = element("div");
    			div31 = element("div");
    			img12 = element("img");
    			t103 = space();
    			div30 = element("div");
    			p30 = element("p");
    			p30.textContent = "Tap on the Settings button, and choose your preferred theme.";
    			t105 = space();
    			p31 = element("p");
    			p31.textContent = "For iOS: toggle 'Dark Mode' on or off.";
    			t107 = space();
    			p32 = element("p");
    			p32.textContent = "For Android: choose between 'Light', 'Dark', and 'Default' modes. Selecting 'Default' will tell Lemmi to follow your device's settings.";
    			t109 = space();
    			details12 = element("details");
    			summary12 = element("summary");
    			summary12.textContent = "How do I turn off the Auto Speak option?";
    			t111 = space();
    			div34 = element("div");
    			div33 = element("div");
    			img13 = element("img");
    			t112 = space();
    			p33 = element("p");
    			p33.textContent = "Tap on the Settings button, then turn ‘Auto Speak’ off.";
    			t114 = space();
    			details13 = element("details");
    			summary13 = element("summary");
    			summary13.textContent = "How do I hide Suggested Words?";
    			t116 = space();
    			div36 = element("div");
    			div35 = element("div");
    			img14 = element("img");
    			t117 = space();
    			p34 = element("p");
    			p34.textContent = "Tap on the Settings button, then turn ‘Show Suggested Words’ off.";
    			t119 = space();
    			details14 = element("details");
    			summary14 = element("summary");
    			summary14.textContent = "How do I hide Images and just have text?";
    			t121 = space();
    			div38 = element("div");
    			div37 = element("div");
    			img15 = element("img");
    			t122 = space();
    			p35 = element("p");
    			p35.textContent = "Tap on the Settings button, then turn ‘Show Images' off.";
    			t124 = space();
    			section2 = element("section");
    			h32 = element("h3");
    			h32.textContent = "3. Subscriptions";
    			t126 = space();
    			details15 = element("details");
    			summary15 = element("summary");
    			summary15.textContent = "How much does Lemmi cost?";
    			t128 = space();
    			div40 = element("div");
    			p36 = element("p");
    			p36.textContent = "Lemmi is a subscription based app with two payment options:";
    			t130 = space();
    			div39 = element("div");
    			p37 = element("p");
    			b0 = element("b");
    			b0.textContent = "Yearly – users pay £41.99 per year (£3.50 per month, saving 22%)";
    			t132 = space();
    			p38 = element("p");
    			b1 = element("b");
    			b1.textContent = "Monthly – users pay £4.49 per month on a rolling contract";
    			t134 = space();
    			p39 = element("p");
    			p39.textContent = "Note: Both options come with a 7-day FREE trial and you can upgrade your subscription at any time.";
    			t136 = space();
    			details16 = element("details");
    			summary16 = element("summary");
    			summary16.textContent = "Do you offer any discounts?";
    			t138 = space();
    			div41 = element("div");
    			p40 = element("p");
    			t139 = text("We occasionally run promotions, to hear about these special discounts please sign up to our Newsletter ");
    			a1 = element("a");
    			a1.textContent = "at the bottom of the screen";
    			t141 = text(".");
    			t142 = space();
    			details17 = element("details");
    			summary17 = element("summary");
    			summary17.textContent = "How do I manage or cancel my subscription renewal?";
    			t144 = space();
    			div44 = element("div");
    			p41 = element("p");
    			p41.textContent = "You can manage your subscription directly through your iCloud or Play Store account, or within the Lemmi app itself.";
    			t146 = space();
    			div43 = element("div");
    			img16 = element("img");
    			t147 = space();
    			div42 = element("div");
    			p42 = element("p");
    			p42.textContent = "Tap on the Settings button.";
    			t149 = space();
    			p43 = element("p");
    			p43.textContent = "Scroll down to the bottom of the page and tap 'Manage Subscription'.";
    			t151 = space();
    			p44 = element("p");
    			p44.textContent = "This will take you to the relevant Store.";
    			t153 = space();
    			p45 = element("p");
    			t154 = text("Note: You will not receive a refund for the fees you have already paid for your current subscription period, but you will have access to the service until the end of your current subscription period. For more information, please refer to Lemmi's ");
    			a2 = element("a");
    			a2.textContent = "Terms of Service";
    			t156 = text(".");
    			t157 = space();
    			details18 = element("details");
    			summary18 = element("summary");
    			summary18.textContent = "How do I install a pre-existing subscription onto a new device?";
    			t159 = space();
    			div45 = element("div");
    			p46 = element("p");
    			p46.textContent = "Ensure you are using the same iCloud or Play Store account. Re-download Lemmi onto your new device and use the ‘Restore previous purchase’ when you open Lemmi for the first time.";
    			t161 = space();
    			details19 = element("details");
    			summary19 = element("summary");
    			summary19.textContent = "Important information";
    			t163 = space();
    			div46 = element("div");
    			p47 = element("p");
    			t164 = text("By using Lemmi you agree that you have read, understood, and agreed to Lemmi's ");
    			a3 = element("a");
    			a3.textContent = "Terms of Service";
    			t166 = text(" and ");
    			a4 = element("a");
    			a4.textContent = "Privacy Policy";
    			t168 = text(".");
    			t169 = space();
    			section3 = element("section");
    			h33 = element("h3");
    			h33.textContent = "4. Feedback and Contact";
    			t171 = space();
    			details20 = element("details");
    			summary20 = element("summary");
    			summary20.textContent = "How do I Submit Feedback?";
    			t173 = space();
    			div49 = element("div");
    			div48 = element("div");
    			img17 = element("img");
    			t174 = space();
    			div47 = element("div");
    			p48 = element("p");
    			p48.textContent = "Tap on the Settings button.";
    			t176 = space();
    			p49 = element("p");
    			p49.textContent = "On the Settings screen, scroll to the bottom and tap 'Submit Feedback'.";
    			t178 = space();
    			p50 = element("p");
    			p50.textContent = "On the new screen, add your feedback and tap ‘Submit’.";
    			t180 = space();
    			details21 = element("details");
    			summary21 = element("summary");
    			summary21.textContent = "Need further help?";
    			t182 = space();
    			div50 = element("div");
    			p51 = element("p");
    			t183 = text("Please contact us at ");
    			a5 = element("a");
    			a5.textContent = "info@lemmichat.com";
    			add_location(h2, file$5, 1, 2, 26);
    			attr_dev(div0, "class", "faq-title svelte-15odnod");
    			add_location(div0, file$5, 0, 0, 0);
    			attr_dev(h30, "class", "svelte-15odnod");
    			add_location(h30, file$5, 4, 2, 79);
    			attr_dev(summary0, "class", "svelte-15odnod");
    			add_location(summary0, file$5, 6, 4, 119);
    			attr_dev(p0, "class", "svelte-15odnod");
    			add_location(p0, file$5, 8, 6, 199);
    			attr_dev(p1, "class", "svelte-15odnod");
    			add_location(p1, file$5, 9, 6, 274);
    			attr_dev(p2, "class", "svelte-15odnod");
    			add_location(p2, file$5, 10, 6, 421);
    			attr_dev(div1, "class", "details-wrapper svelte-15odnod");
    			add_location(div1, file$5, 7, 4, 163);
    			attr_dev(details0, "class", "svelte-15odnod");
    			add_location(details0, file$5, 5, 2, 105);
    			attr_dev(summary1, "class", "svelte-15odnod");
    			add_location(summary1, file$5, 14, 4, 542);
    			if (img0.src !== (img0_src_value = "images/clear.png")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "clear icon");
    			attr_dev(img0, "class", "svelte-15odnod");
    			add_location(img0, file$5, 17, 8, 670);
    			attr_dev(p3, "class", "svelte-15odnod");
    			add_location(p3, file$5, 18, 8, 726);
    			attr_dev(div2, "class", "iconed-text svelte-15odnod");
    			add_location(div2, file$5, 16, 6, 636);
    			if (img1.src !== (img1_src_value = "images/undo.png")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "undo icon");
    			attr_dev(img1, "class", "svelte-15odnod");
    			add_location(img1, file$5, 21, 8, 827);
    			attr_dev(p4, "class", "svelte-15odnod");
    			add_location(p4, file$5, 22, 8, 880);
    			attr_dev(div3, "class", "iconed-text svelte-15odnod");
    			add_location(div3, file$5, 20, 6, 793);
    			if (img2.src !== (img2_src_value = "images/play.png")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "alt", "play icon");
    			attr_dev(img2, "class", "svelte-15odnod");
    			add_location(img2, file$5, 25, 8, 1005);
    			attr_dev(p5, "class", "svelte-15odnod");
    			add_location(p5, file$5, 26, 8, 1058);
    			attr_dev(div4, "class", "iconed-text svelte-15odnod");
    			add_location(div4, file$5, 24, 6, 971);
    			attr_dev(div5, "class", "details-wrapper svelte-15odnod");
    			add_location(div5, file$5, 15, 4, 600);
    			attr_dev(details1, "class", "svelte-15odnod");
    			add_location(details1, file$5, 13, 2, 528);
    			attr_dev(summary2, "class", "svelte-15odnod");
    			add_location(summary2, file$5, 31, 4, 1157);
    			if (img3.src !== (img3_src_value = "images/core.png")) attr_dev(img3, "src", img3_src_value);
    			attr_dev(img3, "alt", "core icon");
    			attr_dev(img3, "class", "svelte-15odnod");
    			add_location(img3, file$5, 34, 8, 1278);
    			attr_dev(p6, "class", "svelte-15odnod");
    			add_location(p6, file$5, 36, 10, 1376);
    			attr_dev(p7, "class", "svelte-15odnod");
    			add_location(p7, file$5, 37, 10, 1465);
    			attr_dev(p8, "class", "svelte-15odnod");
    			add_location(p8, file$5, 38, 10, 1550);
    			attr_dev(div6, "class", "iconed-text-wrapper svelte-15odnod");
    			add_location(div6, file$5, 35, 8, 1332);
    			attr_dev(div7, "class", "iconed-text svelte-15odnod");
    			add_location(div7, file$5, 33, 6, 1244);
    			attr_dev(div8, "class", "details-wrapper svelte-15odnod");
    			add_location(div8, file$5, 32, 4, 1208);
    			attr_dev(details2, "class", "svelte-15odnod");
    			add_location(details2, file$5, 30, 2, 1143);
    			attr_dev(summary3, "class", "svelte-15odnod");
    			add_location(summary3, file$5, 44, 4, 1682);
    			if (img4.src !== (img4_src_value = "images/dictionary.png")) attr_dev(img4, "src", img4_src_value);
    			attr_dev(img4, "alt", "dictionary icon");
    			attr_dev(img4, "class", "svelte-15odnod");
    			add_location(img4, file$5, 47, 8, 1803);
    			attr_dev(p9, "class", "svelte-15odnod");
    			add_location(p9, file$5, 48, 8, 1869);
    			attr_dev(div9, "class", "iconed-text svelte-15odnod");
    			add_location(div9, file$5, 46, 6, 1769);
    			attr_dev(div10, "class", "details-wrapper svelte-15odnod");
    			add_location(div10, file$5, 45, 4, 1733);
    			attr_dev(details3, "class", "svelte-15odnod");
    			add_location(details3, file$5, 43, 2, 1668);
    			attr_dev(summary4, "class", "svelte-15odnod");
    			add_location(summary4, file$5, 53, 4, 1991);
    			if (img5.src !== (img5_src_value = "images/settings.png")) attr_dev(img5, "src", img5_src_value);
    			attr_dev(img5, "alt", "settings icon");
    			attr_dev(img5, "class", "svelte-15odnod");
    			add_location(img5, file$5, 56, 8, 2110);
    			attr_dev(p10, "class", "svelte-15odnod");
    			add_location(p10, file$5, 58, 10, 2216);
    			attr_dev(p11, "class", "svelte-15odnod");
    			add_location(p11, file$5, 59, 10, 2261);
    			attr_dev(div11, "class", "iconed-text-wrapper svelte-15odnod");
    			add_location(div11, file$5, 57, 8, 2172);
    			attr_dev(div12, "class", "iconed-text svelte-15odnod");
    			add_location(div12, file$5, 55, 6, 2076);
    			attr_dev(div13, "class", "details-wrapper svelte-15odnod");
    			add_location(div13, file$5, 54, 4, 2040);
    			attr_dev(details4, "class", "svelte-15odnod");
    			add_location(details4, file$5, 52, 2, 1977);
    			attr_dev(summary5, "class", "svelte-15odnod");
    			add_location(summary5, file$5, 65, 4, 2408);
    			if (img6.src !== (img6_src_value = "images/settings.png")) attr_dev(img6, "src", img6_src_value);
    			attr_dev(img6, "alt", "settings icon");
    			attr_dev(img6, "class", "svelte-15odnod");
    			add_location(img6, file$5, 68, 8, 2535);
    			attr_dev(p12, "class", "svelte-15odnod");
    			add_location(p12, file$5, 70, 10, 2641);
    			attr_dev(p13, "class", "svelte-15odnod");
    			add_location(p13, file$5, 71, 10, 2686);
    			attr_dev(div14, "class", "iconed-text-wrapper svelte-15odnod");
    			add_location(div14, file$5, 69, 8, 2597);
    			attr_dev(div15, "class", "iconed-text svelte-15odnod");
    			add_location(div15, file$5, 67, 6, 2501);
    			attr_dev(div16, "class", "details-wrapper svelte-15odnod");
    			add_location(div16, file$5, 66, 4, 2465);
    			attr_dev(details5, "class", "svelte-15odnod");
    			add_location(details5, file$5, 64, 2, 2394);
    			attr_dev(section0, "class", "faq-section svelte-15odnod");
    			add_location(section0, file$5, 3, 0, 47);
    			attr_dev(h31, "class", "svelte-15odnod");
    			add_location(h31, file$5, 78, 2, 2853);
    			attr_dev(summary6, "class", "svelte-15odnod");
    			add_location(summary6, file$5, 80, 4, 2895);
    			if (img7.src !== (img7_src_value = "images/dictionary.png")) attr_dev(img7, "src", img7_src_value);
    			attr_dev(img7, "alt", "dictionary icon");
    			attr_dev(img7, "class", "svelte-15odnod");
    			add_location(img7, file$5, 83, 8, 3032);
    			attr_dev(p14, "class", "svelte-15odnod");
    			add_location(p14, file$5, 84, 8, 3098);
    			attr_dev(div17, "class", "iconed-text svelte-15odnod");
    			add_location(div17, file$5, 82, 6, 2998);
    			if (img8.src !== (img8_src_value = "images/add.png")) attr_dev(img8, "src", img8_src_value);
    			attr_dev(img8, "alt", "add entry icon");
    			attr_dev(img8, "class", "svelte-15odnod");
    			add_location(img8, file$5, 87, 8, 3188);
    			attr_dev(p15, "class", "svelte-15odnod");
    			add_location(p15, file$5, 89, 10, 3290);
    			attr_dev(p16, "class", "svelte-15odnod");
    			add_location(p16, file$5, 90, 10, 3324);
    			attr_dev(p17, "class", "svelte-15odnod");
    			add_location(p17, file$5, 91, 10, 3469);
    			attr_dev(div18, "class", "iconed-text-wrapper svelte-15odnod");
    			add_location(div18, file$5, 88, 8, 3246);
    			attr_dev(div19, "class", "iconed-text svelte-15odnod");
    			add_location(div19, file$5, 86, 6, 3154);
    			attr_dev(a0, "href", "/terms-of-service.html");
    			add_location(a0, file$5, 94, 133, 3649);
    			attr_dev(p18, "class", "svelte-15odnod");
    			add_location(p18, file$5, 94, 6, 3522);
    			attr_dev(div20, "class", "details-wrapper svelte-15odnod");
    			add_location(div20, file$5, 81, 4, 2962);
    			attr_dev(details6, "class", "svelte-15odnod");
    			add_location(details6, file$5, 79, 2, 2881);
    			attr_dev(summary7, "class", "svelte-15odnod");
    			add_location(summary7, file$5, 98, 4, 3748);
    			if (img9.src !== (img9_src_value = "images/dictionary.png")) attr_dev(img9, "src", img9_src_value);
    			attr_dev(img9, "alt", "dictionary icon");
    			attr_dev(img9, "class", "svelte-15odnod");
    			add_location(img9, file$5, 101, 8, 3896);
    			attr_dev(p19, "class", "svelte-15odnod");
    			add_location(p19, file$5, 102, 8, 3962);
    			attr_dev(div21, "class", "iconed-text svelte-15odnod");
    			add_location(div21, file$5, 100, 6, 3862);
    			if (img10.src !== (img10_src_value = "images/word-book.png")) attr_dev(img10, "src", img10_src_value);
    			attr_dev(img10, "alt", "word book icon");
    			attr_dev(img10, "class", "svelte-15odnod");
    			add_location(img10, file$5, 105, 8, 4052);
    			attr_dev(p20, "class", "svelte-15odnod");
    			add_location(p20, file$5, 107, 10, 4160);
    			attr_dev(p21, "class", "svelte-15odnod");
    			add_location(p21, file$5, 108, 10, 4206);
    			attr_dev(p22, "class", "svelte-15odnod");
    			add_location(p22, file$5, 109, 10, 4332);
    			attr_dev(div22, "class", "iconed-text-wrapper svelte-15odnod");
    			add_location(div22, file$5, 106, 8, 4116);
    			attr_dev(div23, "class", "iconed-text svelte-15odnod");
    			add_location(div23, file$5, 104, 6, 4018);
    			attr_dev(div24, "class", "details-wrapper svelte-15odnod");
    			add_location(div24, file$5, 99, 4, 3826);
    			attr_dev(details7, "class", "svelte-15odnod");
    			add_location(details7, file$5, 97, 2, 3734);
    			attr_dev(summary8, "class", "svelte-15odnod");
    			add_location(summary8, file$5, 115, 4, 4483);
    			attr_dev(p23, "class", "svelte-15odnod");
    			add_location(p23, file$5, 117, 6, 4570);
    			attr_dev(p24, "class", "svelte-15odnod");
    			add_location(p24, file$5, 118, 6, 4728);
    			attr_dev(div25, "class", "details-wrapper svelte-15odnod");
    			add_location(div25, file$5, 116, 4, 4534);
    			attr_dev(details8, "class", "svelte-15odnod");
    			add_location(details8, file$5, 114, 2, 4469);
    			attr_dev(summary9, "class", "svelte-15odnod");
    			add_location(summary9, file$5, 122, 4, 4918);
    			if (img11.src !== (img11_src_value = "images/settings.png")) attr_dev(img11, "src", img11_src_value);
    			attr_dev(img11, "alt", "settings icon");
    			attr_dev(img11, "class", "svelte-15odnod");
    			add_location(img11, file$5, 125, 8, 5047);
    			attr_dev(p25, "class", "svelte-15odnod");
    			add_location(p25, file$5, 127, 10, 5153);
    			attr_dev(p26, "class", "svelte-15odnod");
    			add_location(p26, file$5, 128, 10, 5198);
    			attr_dev(p27, "class", "svelte-15odnod");
    			add_location(p27, file$5, 129, 10, 5274);
    			attr_dev(div26, "class", "iconed-text-wrapper svelte-15odnod");
    			add_location(div26, file$5, 126, 8, 5109);
    			attr_dev(div27, "class", "iconed-text svelte-15odnod");
    			add_location(div27, file$5, 124, 6, 5013);
    			attr_dev(div28, "class", "details-wrapper svelte-15odnod");
    			add_location(div28, file$5, 123, 4, 4977);
    			attr_dev(details9, "class", "svelte-15odnod");
    			add_location(details9, file$5, 121, 2, 4904);
    			attr_dev(summary10, "class", "svelte-15odnod");
    			add_location(summary10, file$5, 135, 4, 5395);
    			attr_dev(p28, "class", "svelte-15odnod");
    			add_location(p28, file$5, 137, 6, 5487);
    			attr_dev(p29, "class", "svelte-15odnod");
    			add_location(p29, file$5, 138, 6, 5653);
    			attr_dev(div29, "class", "details-wrapper svelte-15odnod");
    			add_location(div29, file$5, 136, 4, 5451);
    			attr_dev(details10, "class", "svelte-15odnod");
    			add_location(details10, file$5, 134, 2, 5381);
    			attr_dev(summary11, "class", "svelte-15odnod");
    			add_location(summary11, file$5, 142, 4, 5843);
    			if (img12.src !== (img12_src_value = "images/settings.png")) attr_dev(img12, "src", img12_src_value);
    			attr_dev(img12, "alt", "settings icon");
    			attr_dev(img12, "class", "svelte-15odnod");
    			add_location(img12, file$5, 145, 8, 5977);
    			attr_dev(p30, "class", "svelte-15odnod");
    			add_location(p30, file$5, 147, 10, 6083);
    			attr_dev(p31, "class", "svelte-15odnod");
    			add_location(p31, file$5, 148, 10, 6161);
    			attr_dev(p32, "class", "svelte-15odnod");
    			add_location(p32, file$5, 149, 10, 6217);
    			attr_dev(div30, "class", "iconed-text-wrapper svelte-15odnod");
    			add_location(div30, file$5, 146, 8, 6039);
    			attr_dev(div31, "class", "iconed-text svelte-15odnod");
    			add_location(div31, file$5, 144, 6, 5943);
    			attr_dev(div32, "class", "details-wrapper svelte-15odnod");
    			add_location(div32, file$5, 143, 4, 5907);
    			attr_dev(details11, "class", "svelte-15odnod");
    			add_location(details11, file$5, 141, 2, 5829);
    			attr_dev(summary12, "class", "svelte-15odnod");
    			add_location(summary12, file$5, 155, 4, 6428);
    			if (img13.src !== (img13_src_value = "images/settings.png")) attr_dev(img13, "src", img13_src_value);
    			attr_dev(img13, "alt", "settings icon");
    			attr_dev(img13, "class", "svelte-15odnod");
    			add_location(img13, file$5, 158, 8, 6562);
    			attr_dev(p33, "class", "svelte-15odnod");
    			add_location(p33, file$5, 159, 8, 6624);
    			attr_dev(div33, "class", "iconed-text svelte-15odnod");
    			add_location(div33, file$5, 157, 6, 6528);
    			attr_dev(div34, "class", "details-wrapper svelte-15odnod");
    			add_location(div34, file$5, 156, 4, 6492);
    			attr_dev(details12, "class", "svelte-15odnod");
    			add_location(details12, file$5, 154, 2, 6414);
    			attr_dev(summary13, "class", "svelte-15odnod");
    			add_location(summary13, file$5, 164, 4, 6740);
    			if (img14.src !== (img14_src_value = "images/settings.png")) attr_dev(img14, "src", img14_src_value);
    			attr_dev(img14, "alt", "settings icon");
    			attr_dev(img14, "class", "svelte-15odnod");
    			add_location(img14, file$5, 167, 8, 6864);
    			attr_dev(p34, "class", "svelte-15odnod");
    			add_location(p34, file$5, 168, 8, 6926);
    			attr_dev(div35, "class", "iconed-text svelte-15odnod");
    			add_location(div35, file$5, 166, 6, 6830);
    			attr_dev(div36, "class", "details-wrapper svelte-15odnod");
    			add_location(div36, file$5, 165, 4, 6794);
    			attr_dev(details13, "class", "svelte-15odnod");
    			add_location(details13, file$5, 163, 2, 6726);
    			attr_dev(summary14, "class", "svelte-15odnod");
    			add_location(summary14, file$5, 173, 4, 7052);
    			if (img15.src !== (img15_src_value = "images/settings.png")) attr_dev(img15, "src", img15_src_value);
    			attr_dev(img15, "alt", "settings icon");
    			attr_dev(img15, "class", "svelte-15odnod");
    			add_location(img15, file$5, 176, 8, 7186);
    			attr_dev(p35, "class", "svelte-15odnod");
    			add_location(p35, file$5, 177, 8, 7248);
    			attr_dev(div37, "class", "iconed-text svelte-15odnod");
    			add_location(div37, file$5, 175, 6, 7152);
    			attr_dev(div38, "class", "details-wrapper svelte-15odnod");
    			add_location(div38, file$5, 174, 4, 7116);
    			attr_dev(details14, "class", "svelte-15odnod");
    			add_location(details14, file$5, 172, 2, 7038);
    			attr_dev(section1, "class", "faq-section svelte-15odnod");
    			add_location(section1, file$5, 77, 0, 2821);
    			attr_dev(h32, "class", "svelte-15odnod");
    			add_location(h32, file$5, 183, 2, 7392);
    			attr_dev(summary15, "class", "svelte-15odnod");
    			add_location(summary15, file$5, 185, 4, 7434);
    			attr_dev(p36, "class", "svelte-15odnod");
    			add_location(p36, file$5, 187, 6, 7519);
    			add_location(b0, file$5, 189, 11, 7609);
    			attr_dev(p37, "class", "svelte-15odnod");
    			add_location(p37, file$5, 189, 8, 7606);
    			add_location(b1, file$5, 190, 11, 7696);
    			attr_dev(p38, "class", "svelte-15odnod");
    			add_location(p38, file$5, 190, 8, 7693);
    			add_location(div39, file$5, 188, 6, 7592);
    			attr_dev(p39, "class", "svelte-15odnod");
    			add_location(p39, file$5, 192, 6, 7784);
    			attr_dev(div40, "class", "details-wrapper svelte-15odnod");
    			add_location(div40, file$5, 186, 4, 7483);
    			attr_dev(details15, "class", "svelte-15odnod");
    			add_location(details15, file$5, 184, 2, 7420);
    			attr_dev(summary16, "class", "svelte-15odnod");
    			add_location(summary16, file$5, 196, 4, 7930);
    			attr_dev(a1, "href", "#footer");
    			add_location(a1, file$5, 198, 112, 8123);
    			attr_dev(p40, "class", "svelte-15odnod");
    			add_location(p40, file$5, 198, 6, 8017);
    			attr_dev(div41, "class", "details-wrapper svelte-15odnod");
    			add_location(div41, file$5, 197, 4, 7981);
    			attr_dev(details16, "class", "svelte-15odnod");
    			add_location(details16, file$5, 195, 2, 7916);
    			attr_dev(summary17, "class", "svelte-15odnod");
    			add_location(summary17, file$5, 202, 4, 8218);
    			attr_dev(p41, "class", "svelte-15odnod");
    			add_location(p41, file$5, 204, 6, 8328);
    			if (img16.src !== (img16_src_value = "images/settings.png")) attr_dev(img16, "src", img16_src_value);
    			attr_dev(img16, "alt", "settings icon");
    			attr_dev(img16, "class", "svelte-15odnod");
    			add_location(img16, file$5, 206, 8, 8492);
    			attr_dev(p42, "class", "svelte-15odnod");
    			add_location(p42, file$5, 208, 10, 8598);
    			attr_dev(p43, "class", "svelte-15odnod");
    			add_location(p43, file$5, 209, 10, 8643);
    			attr_dev(p44, "class", "svelte-15odnod");
    			add_location(p44, file$5, 210, 10, 8729);
    			attr_dev(div42, "class", "iconed-text-wrapper svelte-15odnod");
    			add_location(div42, file$5, 207, 8, 8554);
    			attr_dev(div43, "class", "iconed-text svelte-15odnod");
    			add_location(div43, file$5, 205, 6, 8458);
    			attr_dev(a2, "href", "/terms-of-service.html");
    			add_location(a2, file$5, 213, 255, 9061);
    			attr_dev(p45, "class", "svelte-15odnod");
    			add_location(p45, file$5, 213, 6, 8812);
    			attr_dev(div44, "class", "details-wrapper svelte-15odnod");
    			add_location(div44, file$5, 203, 4, 8292);
    			attr_dev(details17, "class", "svelte-15odnod");
    			add_location(details17, file$5, 201, 2, 8204);
    			attr_dev(summary18, "class", "svelte-15odnod");
    			add_location(summary18, file$5, 217, 4, 9160);
    			attr_dev(p46, "class", "svelte-15odnod");
    			add_location(p46, file$5, 219, 6, 9283);
    			attr_dev(div45, "class", "details-wrapper svelte-15odnod");
    			add_location(div45, file$5, 218, 4, 9247);
    			attr_dev(details18, "class", "svelte-15odnod");
    			add_location(details18, file$5, 216, 2, 9146);
    			attr_dev(summary19, "class", "svelte-15odnod");
    			add_location(summary19, file$5, 223, 4, 9509);
    			attr_dev(a3, "href", "/terms-of-service.html");
    			add_location(a3, file$5, 225, 88, 9672);
    			attr_dev(a4, "href", "/privacy-policy.html");
    			add_location(a4, file$5, 225, 146, 9730);
    			attr_dev(p47, "class", "svelte-15odnod");
    			add_location(p47, file$5, 225, 6, 9590);
    			attr_dev(div46, "class", "details-wrapper svelte-15odnod");
    			add_location(div46, file$5, 224, 4, 9554);
    			attr_dev(details19, "class", "svelte-15odnod");
    			add_location(details19, file$5, 222, 2, 9495);
    			attr_dev(section2, "class", "faq-section svelte-15odnod");
    			add_location(section2, file$5, 182, 0, 7360);
    			attr_dev(h33, "class", "svelte-15odnod");
    			add_location(h33, file$5, 230, 2, 9852);
    			attr_dev(summary20, "class", "svelte-15odnod");
    			add_location(summary20, file$5, 232, 4, 9901);
    			if (img17.src !== (img17_src_value = "images/settings.png")) attr_dev(img17, "src", img17_src_value);
    			attr_dev(img17, "alt", "settings icon");
    			attr_dev(img17, "class", "svelte-15odnod");
    			add_location(img17, file$5, 235, 8, 10020);
    			attr_dev(p48, "class", "svelte-15odnod");
    			add_location(p48, file$5, 237, 10, 10126);
    			attr_dev(p49, "class", "svelte-15odnod");
    			add_location(p49, file$5, 238, 10, 10171);
    			attr_dev(p50, "class", "svelte-15odnod");
    			add_location(p50, file$5, 239, 10, 10260);
    			attr_dev(div47, "class", "iconed-text-wrapper svelte-15odnod");
    			add_location(div47, file$5, 236, 8, 10082);
    			attr_dev(div48, "class", "iconed-text svelte-15odnod");
    			add_location(div48, file$5, 234, 6, 9986);
    			attr_dev(div49, "class", "details-wrapper svelte-15odnod");
    			add_location(div49, file$5, 233, 4, 9950);
    			attr_dev(details20, "class", "svelte-15odnod");
    			add_location(details20, file$5, 231, 2, 9887);
    			attr_dev(summary21, "class", "svelte-15odnod");
    			add_location(summary21, file$5, 245, 4, 10390);
    			attr_dev(a5, "href", "mailto:info@lemmichat.com?subject='Contact from Website'");
    			add_location(a5, file$5, 248, 29, 10501);
    			attr_dev(p51, "class", "svelte-15odnod");
    			add_location(p51, file$5, 247, 6, 10468);
    			attr_dev(div50, "class", "details-wrapper svelte-15odnod");
    			add_location(div50, file$5, 246, 4, 10432);
    			attr_dev(details21, "class", "svelte-15odnod");
    			add_location(details21, file$5, 244, 2, 10376);
    			attr_dev(section3, "class", "faq-section svelte-15odnod");
    			add_location(section3, file$5, 229, 0, 9820);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, h2);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, section0, anchor);
    			append_dev(section0, h30);
    			append_dev(section0, t3);
    			append_dev(section0, details0);
    			append_dev(details0, summary0);
    			append_dev(details0, t5);
    			append_dev(details0, div1);
    			append_dev(div1, p0);
    			append_dev(div1, t7);
    			append_dev(div1, p1);
    			append_dev(div1, t9);
    			append_dev(div1, p2);
    			append_dev(section0, t11);
    			append_dev(section0, details1);
    			append_dev(details1, summary1);
    			append_dev(details1, t13);
    			append_dev(details1, div5);
    			append_dev(div5, div2);
    			append_dev(div2, img0);
    			append_dev(div2, t14);
    			append_dev(div2, p3);
    			append_dev(div5, t16);
    			append_dev(div5, div3);
    			append_dev(div3, img1);
    			append_dev(div3, t17);
    			append_dev(div3, p4);
    			append_dev(div5, t19);
    			append_dev(div5, div4);
    			append_dev(div4, img2);
    			append_dev(div4, t20);
    			append_dev(div4, p5);
    			append_dev(section0, t22);
    			append_dev(section0, details2);
    			append_dev(details2, summary2);
    			append_dev(details2, t24);
    			append_dev(details2, div8);
    			append_dev(div8, div7);
    			append_dev(div7, img3);
    			append_dev(div7, t25);
    			append_dev(div7, div6);
    			append_dev(div6, p6);
    			append_dev(div6, t27);
    			append_dev(div6, p7);
    			append_dev(div6, t29);
    			append_dev(div6, p8);
    			append_dev(section0, t31);
    			append_dev(section0, details3);
    			append_dev(details3, summary3);
    			append_dev(details3, t33);
    			append_dev(details3, div10);
    			append_dev(div10, div9);
    			append_dev(div9, img4);
    			append_dev(div9, t34);
    			append_dev(div9, p9);
    			append_dev(section0, t36);
    			append_dev(section0, details4);
    			append_dev(details4, summary4);
    			append_dev(details4, t38);
    			append_dev(details4, div13);
    			append_dev(div13, div12);
    			append_dev(div12, img5);
    			append_dev(div12, t39);
    			append_dev(div12, div11);
    			append_dev(div11, p10);
    			append_dev(div11, t41);
    			append_dev(div11, p11);
    			append_dev(section0, t43);
    			append_dev(section0, details5);
    			append_dev(details5, summary5);
    			append_dev(details5, t45);
    			append_dev(details5, div16);
    			append_dev(div16, div15);
    			append_dev(div15, img6);
    			append_dev(div15, t46);
    			append_dev(div15, div14);
    			append_dev(div14, p12);
    			append_dev(div14, t48);
    			append_dev(div14, p13);
    			insert_dev(target, t50, anchor);
    			insert_dev(target, section1, anchor);
    			append_dev(section1, h31);
    			append_dev(section1, t52);
    			append_dev(section1, details6);
    			append_dev(details6, summary6);
    			append_dev(details6, t54);
    			append_dev(details6, div20);
    			append_dev(div20, div17);
    			append_dev(div17, img7);
    			append_dev(div17, t55);
    			append_dev(div17, p14);
    			append_dev(div20, t57);
    			append_dev(div20, div19);
    			append_dev(div19, img8);
    			append_dev(div19, t58);
    			append_dev(div19, div18);
    			append_dev(div18, p15);
    			append_dev(div18, t60);
    			append_dev(div18, p16);
    			append_dev(div18, t62);
    			append_dev(div18, p17);
    			append_dev(div20, t64);
    			append_dev(div20, p18);
    			append_dev(p18, t65);
    			append_dev(p18, a0);
    			append_dev(section1, t67);
    			append_dev(section1, details7);
    			append_dev(details7, summary7);
    			append_dev(details7, t69);
    			append_dev(details7, div24);
    			append_dev(div24, div21);
    			append_dev(div21, img9);
    			append_dev(div21, t70);
    			append_dev(div21, p19);
    			append_dev(div24, t72);
    			append_dev(div24, div23);
    			append_dev(div23, img10);
    			append_dev(div23, t73);
    			append_dev(div23, div22);
    			append_dev(div22, p20);
    			append_dev(div22, t75);
    			append_dev(div22, p21);
    			append_dev(div22, t77);
    			append_dev(div22, p22);
    			append_dev(section1, t79);
    			append_dev(section1, details8);
    			append_dev(details8, summary8);
    			append_dev(details8, t81);
    			append_dev(details8, div25);
    			append_dev(div25, p23);
    			append_dev(div25, t83);
    			append_dev(div25, p24);
    			append_dev(section1, t85);
    			append_dev(section1, details9);
    			append_dev(details9, summary9);
    			append_dev(details9, t87);
    			append_dev(details9, div28);
    			append_dev(div28, div27);
    			append_dev(div27, img11);
    			append_dev(div27, t88);
    			append_dev(div27, div26);
    			append_dev(div26, p25);
    			append_dev(div26, t90);
    			append_dev(div26, p26);
    			append_dev(div26, t92);
    			append_dev(div26, p27);
    			append_dev(section1, t94);
    			append_dev(section1, details10);
    			append_dev(details10, summary10);
    			append_dev(details10, t96);
    			append_dev(details10, div29);
    			append_dev(div29, p28);
    			append_dev(div29, t98);
    			append_dev(div29, p29);
    			append_dev(section1, t100);
    			append_dev(section1, details11);
    			append_dev(details11, summary11);
    			append_dev(details11, t102);
    			append_dev(details11, div32);
    			append_dev(div32, div31);
    			append_dev(div31, img12);
    			append_dev(div31, t103);
    			append_dev(div31, div30);
    			append_dev(div30, p30);
    			append_dev(div30, t105);
    			append_dev(div30, p31);
    			append_dev(div30, t107);
    			append_dev(div30, p32);
    			append_dev(section1, t109);
    			append_dev(section1, details12);
    			append_dev(details12, summary12);
    			append_dev(details12, t111);
    			append_dev(details12, div34);
    			append_dev(div34, div33);
    			append_dev(div33, img13);
    			append_dev(div33, t112);
    			append_dev(div33, p33);
    			append_dev(section1, t114);
    			append_dev(section1, details13);
    			append_dev(details13, summary13);
    			append_dev(details13, t116);
    			append_dev(details13, div36);
    			append_dev(div36, div35);
    			append_dev(div35, img14);
    			append_dev(div35, t117);
    			append_dev(div35, p34);
    			append_dev(section1, t119);
    			append_dev(section1, details14);
    			append_dev(details14, summary14);
    			append_dev(details14, t121);
    			append_dev(details14, div38);
    			append_dev(div38, div37);
    			append_dev(div37, img15);
    			append_dev(div37, t122);
    			append_dev(div37, p35);
    			insert_dev(target, t124, anchor);
    			insert_dev(target, section2, anchor);
    			append_dev(section2, h32);
    			append_dev(section2, t126);
    			append_dev(section2, details15);
    			append_dev(details15, summary15);
    			append_dev(details15, t128);
    			append_dev(details15, div40);
    			append_dev(div40, p36);
    			append_dev(div40, t130);
    			append_dev(div40, div39);
    			append_dev(div39, p37);
    			append_dev(p37, b0);
    			append_dev(div39, t132);
    			append_dev(div39, p38);
    			append_dev(p38, b1);
    			append_dev(div40, t134);
    			append_dev(div40, p39);
    			append_dev(section2, t136);
    			append_dev(section2, details16);
    			append_dev(details16, summary16);
    			append_dev(details16, t138);
    			append_dev(details16, div41);
    			append_dev(div41, p40);
    			append_dev(p40, t139);
    			append_dev(p40, a1);
    			append_dev(p40, t141);
    			append_dev(section2, t142);
    			append_dev(section2, details17);
    			append_dev(details17, summary17);
    			append_dev(details17, t144);
    			append_dev(details17, div44);
    			append_dev(div44, p41);
    			append_dev(div44, t146);
    			append_dev(div44, div43);
    			append_dev(div43, img16);
    			append_dev(div43, t147);
    			append_dev(div43, div42);
    			append_dev(div42, p42);
    			append_dev(div42, t149);
    			append_dev(div42, p43);
    			append_dev(div42, t151);
    			append_dev(div42, p44);
    			append_dev(div44, t153);
    			append_dev(div44, p45);
    			append_dev(p45, t154);
    			append_dev(p45, a2);
    			append_dev(p45, t156);
    			append_dev(section2, t157);
    			append_dev(section2, details18);
    			append_dev(details18, summary18);
    			append_dev(details18, t159);
    			append_dev(details18, div45);
    			append_dev(div45, p46);
    			append_dev(section2, t161);
    			append_dev(section2, details19);
    			append_dev(details19, summary19);
    			append_dev(details19, t163);
    			append_dev(details19, div46);
    			append_dev(div46, p47);
    			append_dev(p47, t164);
    			append_dev(p47, a3);
    			append_dev(p47, t166);
    			append_dev(p47, a4);
    			append_dev(p47, t168);
    			insert_dev(target, t169, anchor);
    			insert_dev(target, section3, anchor);
    			append_dev(section3, h33);
    			append_dev(section3, t171);
    			append_dev(section3, details20);
    			append_dev(details20, summary20);
    			append_dev(details20, t173);
    			append_dev(details20, div49);
    			append_dev(div49, div48);
    			append_dev(div48, img17);
    			append_dev(div48, t174);
    			append_dev(div48, div47);
    			append_dev(div47, p48);
    			append_dev(div47, t176);
    			append_dev(div47, p49);
    			append_dev(div47, t178);
    			append_dev(div47, p50);
    			append_dev(section3, t180);
    			append_dev(section3, details21);
    			append_dev(details21, summary21);
    			append_dev(details21, t182);
    			append_dev(details21, div50);
    			append_dev(div50, p51);
    			append_dev(p51, t183);
    			append_dev(p51, a5);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(section0);
    			if (detaching) detach_dev(t50);
    			if (detaching) detach_dev(section1);
    			if (detaching) detach_dev(t124);
    			if (detaching) detach_dev(section2);
    			if (detaching) detach_dev(t169);
    			if (detaching) detach_dev(section3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$5($$self, $$props) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("FAQs", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<FAQs> was created with unknown prop '${key}'`);
    	});

    	return [];
    }

    class FAQs extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "FAQs",
    			options,
    			id: create_fragment$5.name
    		});
    	}
    }

    /* src/pages/Contact.svelte generated by Svelte v3.29.0 */
    const file$6 = "src/pages/Contact.svelte";

    // (42:8) {#if success}
    function create_if_block_1$1(ctx) {
    	let p;
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(/*success*/ ctx[4]);
    			attr_dev(p, "class", "success svelte-4scazb");
    			add_location(p, file$6, 42, 10, 1169);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*success*/ 16) set_data_dev(t, /*success*/ ctx[4]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(42:8) {#if success}",
    		ctx
    	});

    	return block;
    }

    // (45:8) {#if error}
    function create_if_block$1(ctx) {
    	let p;
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(/*error*/ ctx[5]);
    			attr_dev(p, "class", "error svelte-4scazb");
    			add_location(p, file$6, 45, 10, 1246);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*error*/ 32) set_data_dev(t, /*error*/ ctx[5]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(45:8) {#if error}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let div0;
    	let h2;
    	let t0_value = /*$_*/ ctx[6]("contact.title").toUpperCase() + "";
    	let t0;
    	let t1;
    	let section;
    	let p0;
    	let t2_value = /*$_*/ ctx[6]("contact.instructions") + "";
    	let t2;
    	let t3;
    	let div6;
    	let div5;
    	let div1;
    	let h3;
    	let t4_value = /*$_*/ ctx[6]("contact.form") + "";
    	let t4;
    	let t5;
    	let t6;
    	let t7;
    	let form;
    	let div4;
    	let div2;
    	let label0;
    	let t9;
    	let input0;
    	let t10;
    	let div3;
    	let label1;
    	let t12;
    	let input1;
    	let t13;
    	let label2;
    	let t15;
    	let input2;
    	let t16;
    	let label3;
    	let t18;
    	let textarea;
    	let t19;
    	let button;
    	let t20_value = /*$_*/ ctx[6]("contact.submit").toUpperCase() + "";
    	let t20;
    	let t21;
    	let p1;
    	let t22_value = /*$_*/ ctx[6]("contact.notes") + "";
    	let t22;
    	let mounted;
    	let dispose;
    	let if_block0 = /*success*/ ctx[4] && create_if_block_1$1(ctx);
    	let if_block1 = /*error*/ ctx[5] && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			h2 = element("h2");
    			t0 = text(t0_value);
    			t1 = space();
    			section = element("section");
    			p0 = element("p");
    			t2 = text(t2_value);
    			t3 = space();
    			div6 = element("div");
    			div5 = element("div");
    			div1 = element("div");
    			h3 = element("h3");
    			t4 = text(t4_value);
    			t5 = space();
    			if (if_block0) if_block0.c();
    			t6 = space();
    			if (if_block1) if_block1.c();
    			t7 = space();
    			form = element("form");
    			div4 = element("div");
    			div2 = element("div");
    			label0 = element("label");
    			label0.textContent = "First Name:*";
    			t9 = space();
    			input0 = element("input");
    			t10 = space();
    			div3 = element("div");
    			label1 = element("label");
    			label1.textContent = "Last Name:";
    			t12 = space();
    			input1 = element("input");
    			t13 = space();
    			label2 = element("label");
    			label2.textContent = "Email:*";
    			t15 = space();
    			input2 = element("input");
    			t16 = space();
    			label3 = element("label");
    			label3.textContent = "Message:*";
    			t18 = space();
    			textarea = element("textarea");
    			t19 = space();
    			button = element("button");
    			t20 = text(t20_value);
    			t21 = space();
    			p1 = element("p");
    			t22 = text(t22_value);
    			add_location(h2, file$6, 33, 2, 899);
    			attr_dev(div0, "class", "contact-title svelte-4scazb");
    			add_location(div0, file$6, 32, 0, 869);
    			attr_dev(p0, "class", "svelte-4scazb");
    			add_location(p0, file$6, 36, 2, 979);
    			attr_dev(h3, "class", "svelte-4scazb");
    			add_location(h3, file$6, 40, 8, 1107);
    			attr_dev(div1, "class", "form-header svelte-4scazb");
    			add_location(div1, file$6, 39, 6, 1073);
    			attr_dev(label0, "for", "first-name");
    			add_location(label0, file$6, 51, 12, 1388);
    			attr_dev(input0, "id", "first-name");
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "autocomplete", "name");
    			input0.required = true;
    			attr_dev(input0, "class", "svelte-4scazb");
    			add_location(input0, file$6, 52, 12, 1445);
    			attr_dev(div2, "class", "svelte-4scazb");
    			add_location(div2, file$6, 50, 10, 1370);
    			attr_dev(label1, "for", "last-name");
    			add_location(label1, file$6, 61, 12, 1684);
    			attr_dev(input1, "id", "last-name");
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "autocomplete", "additional-name");
    			attr_dev(input1, "class", "svelte-4scazb");
    			add_location(input1, file$6, 62, 12, 1738);
    			attr_dev(div3, "class", "svelte-4scazb");
    			add_location(div3, file$6, 60, 10, 1666);
    			attr_dev(div4, "class", "name svelte-4scazb");
    			add_location(div4, file$6, 49, 8, 1341);
    			attr_dev(label2, "for", "email");
    			add_location(label2, file$6, 70, 8, 1958);
    			attr_dev(input2, "type", "email");
    			attr_dev(input2, "id", "email");
    			input2.required = true;
    			attr_dev(input2, "autocomplete", "email");
    			attr_dev(input2, "class", "svelte-4scazb");
    			add_location(input2, file$6, 71, 8, 2001);
    			attr_dev(label3, "for", "message");
    			add_location(label3, file$6, 78, 8, 2176);
    			attr_dev(textarea, "id", "message");
    			textarea.required = true;
    			attr_dev(textarea, "class", "svelte-4scazb");
    			add_location(textarea, file$6, 79, 8, 2223);
    			attr_dev(form, "id", "contact-form");
    			attr_dev(form, "class", "svelte-4scazb");
    			add_location(form, file$6, 48, 6, 1308);
    			attr_dev(button, "class", "svelte-4scazb");
    			add_location(button, file$6, 85, 6, 2363);
    			attr_dev(div5, "class", "form-wrapper svelte-4scazb");
    			add_location(div5, file$6, 38, 4, 1040);
    			attr_dev(div6, "class", "form svelte-4scazb");
    			add_location(div6, file$6, 37, 2, 1017);
    			attr_dev(p1, "class", "svelte-4scazb");
    			add_location(p1, file$6, 88, 2, 2463);
    			attr_dev(section, "class", "contact svelte-4scazb");
    			add_location(section, file$6, 35, 0, 951);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, h2);
    			append_dev(h2, t0);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, section, anchor);
    			append_dev(section, p0);
    			append_dev(p0, t2);
    			append_dev(section, t3);
    			append_dev(section, div6);
    			append_dev(div6, div5);
    			append_dev(div5, div1);
    			append_dev(div1, h3);
    			append_dev(h3, t4);
    			append_dev(div1, t5);
    			if (if_block0) if_block0.m(div1, null);
    			append_dev(div1, t6);
    			if (if_block1) if_block1.m(div1, null);
    			append_dev(div5, t7);
    			append_dev(div5, form);
    			append_dev(form, div4);
    			append_dev(div4, div2);
    			append_dev(div2, label0);
    			append_dev(div2, t9);
    			append_dev(div2, input0);
    			append_dev(div4, t10);
    			append_dev(div4, div3);
    			append_dev(div3, label1);
    			append_dev(div3, t12);
    			append_dev(div3, input1);
    			append_dev(form, t13);
    			append_dev(form, label2);
    			append_dev(form, t15);
    			append_dev(form, input2);
    			append_dev(form, t16);
    			append_dev(form, label3);
    			append_dev(form, t18);
    			append_dev(form, textarea);
    			append_dev(div5, t19);
    			append_dev(div5, button);
    			append_dev(button, t20);
    			append_dev(section, t21);
    			append_dev(section, p1);
    			append_dev(p1, t22);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "change", /*change_handler*/ ctx[8], false, false, false),
    					listen_dev(input1, "change", /*change_handler_1*/ ctx[9], false, false, false),
    					listen_dev(input2, "change", /*change_handler_2*/ ctx[10], false, false, false),
    					listen_dev(textarea, "change", /*change_handler_3*/ ctx[11], false, false, false),
    					listen_dev(button, "click", /*handleSubmit*/ ctx[7], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$_*/ 64 && t0_value !== (t0_value = /*$_*/ ctx[6]("contact.title").toUpperCase() + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*$_*/ 64 && t2_value !== (t2_value = /*$_*/ ctx[6]("contact.instructions") + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*$_*/ 64 && t4_value !== (t4_value = /*$_*/ ctx[6]("contact.form") + "")) set_data_dev(t4, t4_value);

    			if (/*success*/ ctx[4]) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_1$1(ctx);
    					if_block0.c();
    					if_block0.m(div1, t6);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (/*error*/ ctx[5]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    				} else {
    					if_block1 = create_if_block$1(ctx);
    					if_block1.c();
    					if_block1.m(div1, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}

    			if (dirty & /*$_*/ 64 && t20_value !== (t20_value = /*$_*/ ctx[6]("contact.submit").toUpperCase() + "")) set_data_dev(t20, t20_value);
    			if (dirty & /*$_*/ 64 && t22_value !== (t22_value = /*$_*/ ctx[6]("contact.notes") + "")) set_data_dev(t22, t22_value);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(section);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let $_;
    	validate_store(te, "_");
    	component_subscribe($$self, te, $$value => $$invalidate(6, $_ = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Contact", slots, []);
    	let first, last, email, feedback, success, error;

    	async function handleSubmit(e) {
    		const url = "https://bize978r9h.execute-api.us-east-2.amazonaws.com/Production/contact";

    		const res = await fetch(url, {
    			method: "POST",
    			headers: {
    				"Content-Type": "application/json",
    				"Accept": "application/json"
    			},
    			body: JSON.stringify({ feedback, first, last, email })
    		});

    		const response = await res.json();

    		if (response.statusCode && response.statusCode === 200) {
    			$$invalidate(4, success = contact.success);
    			$$invalidate(5, error = undefined);
    			document.getElementById("contact-form").reset();
    		} else {
    			$$invalidate(5, error = contact.error);
    			$$invalidate(4, success = undefined);
    		}

    		$$invalidate(0, first = undefined);
    		$$invalidate(1, last = undefined);
    		$$invalidate(2, email = undefined);
    		$$invalidate(3, feedback = undefined);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Contact> was created with unknown prop '${key}'`);
    	});

    	const change_handler = e => $$invalidate(0, first = e.target.value);
    	const change_handler_1 = e => $$invalidate(1, last = e.target.value);
    	const change_handler_2 = e => $$invalidate(2, email = e.target.value);
    	const change_handler_3 = e => $$invalidate(3, feedback = e.target.value);

    	$$self.$capture_state = () => ({
    		_: te,
    		first,
    		last,
    		email,
    		feedback,
    		success,
    		error,
    		handleSubmit,
    		$_
    	});

    	$$self.$inject_state = $$props => {
    		if ("first" in $$props) $$invalidate(0, first = $$props.first);
    		if ("last" in $$props) $$invalidate(1, last = $$props.last);
    		if ("email" in $$props) $$invalidate(2, email = $$props.email);
    		if ("feedback" in $$props) $$invalidate(3, feedback = $$props.feedback);
    		if ("success" in $$props) $$invalidate(4, success = $$props.success);
    		if ("error" in $$props) $$invalidate(5, error = $$props.error);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		first,
    		last,
    		email,
    		feedback,
    		success,
    		error,
    		$_,
    		handleSubmit,
    		change_handler,
    		change_handler_1,
    		change_handler_2,
    		change_handler_3
    	];
    }

    class Contact extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Contact",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src/components/Footer.svelte generated by Svelte v3.29.0 */
    const file$7 = "src/components/Footer.svelte";

    // (49:6) {:else}
    function create_else_block(ctx) {
    	let t0;
    	let div;
    	let input;
    	let t1;
    	let button;
    	let t2_value = /*$_*/ ctx[3]("actions.newsletter.button").toUpperCase() + "";
    	let t2;
    	let mounted;
    	let dispose;
    	let if_block = /*newsletterMsg*/ ctx[2] && !/*newsletterSuccess*/ ctx[1] && create_if_block_1$2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			t0 = space();
    			div = element("div");
    			input = element("input");
    			t1 = space();
    			button = element("button");
    			t2 = text(t2_value);
    			attr_dev(input, "id", "newletter");
    			attr_dev(input, "name", "newletter");
    			attr_dev(input, "type", "email");
    			attr_dev(input, "placeholder", "EMAIL ADDRESS");
    			attr_dev(input, "aria-label", "Newsletter Sign Up");
    			input.required = true;
    			attr_dev(input, "class", "svelte-1rq2wn");
    			add_location(input, file$7, 53, 8, 1505);
    			attr_dev(button, "id", "submit");
    			attr_dev(button, "class", "submit svelte-1rq2wn");
    			add_location(button, file$7, 62, 8, 1761);
    			attr_dev(div, "class", "subscribe svelte-1rq2wn");
    			add_location(div, file$7, 52, 6, 1473);
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, input);
    			set_input_value(input, /*email*/ ctx[0]);
    			append_dev(div, t1);
    			append_dev(div, button);
    			append_dev(button, t2);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[6]),
    					listen_dev(input, "input", /*onInputChange*/ ctx[5], false, false, false),
    					listen_dev(button, "click", /*handleSubmit*/ ctx[4], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (/*newsletterMsg*/ ctx[2] && !/*newsletterSuccess*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1$2(ctx);
    					if_block.c();
    					if_block.m(t0.parentNode, t0);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (dirty & /*email*/ 1 && input.value !== /*email*/ ctx[0]) {
    				set_input_value(input, /*email*/ ctx[0]);
    			}

    			if (dirty & /*$_*/ 8 && t2_value !== (t2_value = /*$_*/ ctx[3]("actions.newsletter.button").toUpperCase() + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(49:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (47:6) {#if newsletterMsg && newsletterSuccess}
    function create_if_block$2(ctx) {
    	let p;
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(/*newsletterMsg*/ ctx[2]);
    			attr_dev(p, "class", "message svelte-1rq2wn");
    			toggle_class(p, "success", /*newsletterSuccess*/ ctx[1]);
    			add_location(p, file$7, 47, 8, 1273);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*newsletterMsg*/ 4) set_data_dev(t, /*newsletterMsg*/ ctx[2]);

    			if (dirty & /*newsletterSuccess*/ 2) {
    				toggle_class(p, "success", /*newsletterSuccess*/ ctx[1]);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(47:6) {#if newsletterMsg && newsletterSuccess}",
    		ctx
    	});

    	return block;
    }

    // (50:6) {#if newsletterMsg && !newsletterSuccess}
    function create_if_block_1$2(ctx) {
    	let p;
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(/*newsletterMsg*/ ctx[2]);
    			attr_dev(p, "class", "message svelte-1rq2wn");
    			add_location(p, file$7, 50, 8, 1416);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*newsletterMsg*/ 4) set_data_dev(t, /*newsletterMsg*/ ctx[2]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(50:6) {#if newsletterMsg && !newsletterSuccess}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let footer;
    	let div6;
    	let div0;
    	let p0;
    	let t0_value = /*$_*/ ctx[3]("actions.newsletter.heading") + "";
    	let t0;
    	let t1;
    	let t2;
    	let div1;
    	let a0;
    	let img0;
    	let img0_src_value;
    	let a0_href_value;
    	let t3;
    	let a1;
    	let img1;
    	let img1_src_value;
    	let a1_href_value;
    	let t4;
    	let a2;
    	let img2;
    	let img2_src_value;
    	let a2_href_value;
    	let t5;
    	let a3;
    	let img3;
    	let img3_src_value;
    	let a3_href_value;
    	let t6;
    	let div5;
    	let div2;
    	let p1;
    	let t8;
    	let p2;
    	let t10;
    	let div4;
    	let div3;
    	let a4;
    	let t12;
    	let a5;

    	function select_block_type(ctx, dirty) {
    		if (/*newsletterMsg*/ ctx[2] && /*newsletterSuccess*/ ctx[1]) return create_if_block$2;
    		return create_else_block;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		c: function create() {
    			footer = element("footer");
    			div6 = element("div");
    			div0 = element("div");
    			p0 = element("p");
    			t0 = text(t0_value);
    			t1 = space();
    			if_block.c();
    			t2 = space();
    			div1 = element("div");
    			a0 = element("a");
    			img0 = element("img");
    			t3 = space();
    			a1 = element("a");
    			img1 = element("img");
    			t4 = space();
    			a2 = element("a");
    			img2 = element("img");
    			t5 = space();
    			a3 = element("a");
    			img3 = element("img");
    			t6 = space();
    			div5 = element("div");
    			div2 = element("div");
    			p1 = element("p");
    			p1.textContent = "© 2020 Jenix Technologies LTD";
    			t8 = space();
    			p2 = element("p");
    			p2.textContent = "Dedicated to N. Lemmikki Hyry";
    			t10 = space();
    			div4 = element("div");
    			div3 = element("div");
    			a4 = element("a");
    			a4.textContent = "Privacy Policy";
    			t12 = space();
    			a5 = element("a");
    			a5.textContent = "Terms of Service";
    			attr_dev(p0, "class", "heading");
    			add_location(p0, file$7, 45, 6, 1160);
    			attr_dev(div0, "class", "subscribe-wrapper svelte-1rq2wn");
    			add_location(div0, file$7, 44, 4, 1122);
    			attr_dev(img0, "class", "social-icon svelte-1rq2wn");
    			if (img0.src !== (img0_src_value = "images/email.svg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "social-icon");
    			add_location(img0, file$7, 70, 6, 2030);
    			attr_dev(a0, "href", a0_href_value = /*$_*/ ctx[3]("links.email"));
    			attr_dev(a0, "rel", "noopener");
    			attr_dev(a0, "target", "_blank");
    			add_location(a0, file$7, 69, 4, 1964);
    			attr_dev(img1, "class", "social-icon svelte-1rq2wn");
    			if (img1.src !== (img1_src_value = "images/twitter.svg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "social-icon");
    			add_location(img1, file$7, 73, 6, 2180);
    			attr_dev(a1, "href", a1_href_value = /*$_*/ ctx[3]("links.twitter"));
    			attr_dev(a1, "rel", "noopener");
    			attr_dev(a1, "target", "_blank");
    			add_location(a1, file$7, 72, 4, 2112);
    			attr_dev(img2, "class", "social-icon svelte-1rq2wn");
    			if (img2.src !== (img2_src_value = "images/facebook.svg")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "alt", "social-icon");
    			add_location(img2, file$7, 76, 6, 2333);
    			attr_dev(a2, "href", a2_href_value = /*$_*/ ctx[3]("links.facebook"));
    			attr_dev(a2, "rel", "noopener");
    			attr_dev(a2, "target", "_blank");
    			add_location(a2, file$7, 75, 4, 2264);
    			attr_dev(img3, "class", "social-icon svelte-1rq2wn");
    			if (img3.src !== (img3_src_value = "images/instagram.svg")) attr_dev(img3, "src", img3_src_value);
    			attr_dev(img3, "alt", "social-icon");
    			add_location(img3, file$7, 79, 6, 2488);
    			attr_dev(a3, "href", a3_href_value = /*$_*/ ctx[3]("links.instagram"));
    			attr_dev(a3, "rel", "noopener");
    			attr_dev(a3, "target", "_blank");
    			add_location(a3, file$7, 78, 4, 2418);
    			attr_dev(div1, "class", "social-links svelte-1rq2wn");
    			add_location(div1, file$7, 68, 2, 1933);
    			attr_dev(p1, "class", "svelte-1rq2wn");
    			add_location(p1, file$7, 84, 6, 2641);
    			attr_dev(div2, "class", "copywrite svelte-1rq2wn");
    			add_location(div2, file$7, 83, 4, 2611);
    			attr_dev(p2, "class", "memorial svelte-1rq2wn");
    			add_location(p2, file$7, 86, 4, 2698);
    			attr_dev(a4, "href", "/privacy-policy.html");
    			attr_dev(a4, "class", "svelte-1rq2wn");
    			add_location(a4, file$7, 89, 8, 2828);
    			attr_dev(a5, "href", "/terms-of-service.html");
    			attr_dev(a5, "class", "svelte-1rq2wn");
    			add_location(a5, file$7, 90, 8, 2886);
    			attr_dev(div3, "class", "navigation svelte-1rq2wn");
    			add_location(div3, file$7, 88, 6, 2795);
    			attr_dev(div4, "class", "navigation-wrapper svelte-1rq2wn");
    			add_location(div4, file$7, 87, 4, 2756);
    			attr_dev(div5, "class", "small-print svelte-1rq2wn");
    			add_location(div5, file$7, 82, 2, 2581);
    			attr_dev(div6, "class", "footer-content svelte-1rq2wn");
    			add_location(div6, file$7, 43, 2, 1089);
    			attr_dev(footer, "id", "footer");
    			attr_dev(footer, "class", "svelte-1rq2wn");
    			add_location(footer, file$7, 42, 0, 1066);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, footer, anchor);
    			append_dev(footer, div6);
    			append_dev(div6, div0);
    			append_dev(div0, p0);
    			append_dev(p0, t0);
    			append_dev(div0, t1);
    			if_block.m(div0, null);
    			append_dev(div6, t2);
    			append_dev(div6, div1);
    			append_dev(div1, a0);
    			append_dev(a0, img0);
    			append_dev(div1, t3);
    			append_dev(div1, a1);
    			append_dev(a1, img1);
    			append_dev(div1, t4);
    			append_dev(div1, a2);
    			append_dev(a2, img2);
    			append_dev(div1, t5);
    			append_dev(div1, a3);
    			append_dev(a3, img3);
    			append_dev(div6, t6);
    			append_dev(div6, div5);
    			append_dev(div5, div2);
    			append_dev(div2, p1);
    			append_dev(div5, t8);
    			append_dev(div5, p2);
    			append_dev(div5, t10);
    			append_dev(div5, div4);
    			append_dev(div4, div3);
    			append_dev(div3, a4);
    			append_dev(div3, t12);
    			append_dev(div3, a5);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*$_*/ 8 && t0_value !== (t0_value = /*$_*/ ctx[3]("actions.newsletter.heading") + "")) set_data_dev(t0, t0_value);

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(div0, null);
    				}
    			}

    			if (dirty & /*$_*/ 8 && a0_href_value !== (a0_href_value = /*$_*/ ctx[3]("links.email"))) {
    				attr_dev(a0, "href", a0_href_value);
    			}

    			if (dirty & /*$_*/ 8 && a1_href_value !== (a1_href_value = /*$_*/ ctx[3]("links.twitter"))) {
    				attr_dev(a1, "href", a1_href_value);
    			}

    			if (dirty & /*$_*/ 8 && a2_href_value !== (a2_href_value = /*$_*/ ctx[3]("links.facebook"))) {
    				attr_dev(a2, "href", a2_href_value);
    			}

    			if (dirty & /*$_*/ 8 && a3_href_value !== (a3_href_value = /*$_*/ ctx[3]("links.instagram"))) {
    				attr_dev(a3, "href", a3_href_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(footer);
    			if_block.d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let $_;
    	validate_store(te, "_");
    	component_subscribe($$self, te, $$value => $$invalidate(3, $_ = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Footer", slots, []);
    	let email;
    	let successMsg = $_("actions.newsletter.success");
    	let newsletterSuccess = false;
    	let newsletterMsg;

    	async function handleSubmit() {
    		const url = "https://bize978r9h.execute-api.us-east-2.amazonaws.com/Production/join-newsletter";
    		$$invalidate(1, newsletterSuccess = true);
    		$$invalidate(2, newsletterMsg = successMsg);

    		const res = await fetch(url, {
    			method: "POST",
    			headers: {
    				"Content-Type": "application/json",
    				"Accept": "application/json"
    			},
    			body: JSON.stringify({ email })
    		});

    		const response = await res.json();

    		if (response.statusCode && response.statusCode === 200) {
    			$$invalidate(1, newsletterSuccess = true);
    			$$invalidate(2, newsletterMsg = successMsg);
    		} else {
    			const body = JSON.parse(response.body);
    			$$invalidate(1, newsletterSuccess = false);
    			$$invalidate(2, newsletterMsg = body.message);
    		}
    	}

    	function onInputChange(e) {
    		if (!newsletterMsg) {
    			return;
    		}

    		if (e.target.value === "" && newsletterMsg) {
    			$$invalidate(2, newsletterMsg = null);
    		}
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Footer> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		email = this.value;
    		$$invalidate(0, email);
    	}

    	$$self.$capture_state = () => ({
    		_: te,
    		email,
    		successMsg,
    		newsletterSuccess,
    		newsletterMsg,
    		handleSubmit,
    		onInputChange,
    		$_
    	});

    	$$self.$inject_state = $$props => {
    		if ("email" in $$props) $$invalidate(0, email = $$props.email);
    		if ("successMsg" in $$props) successMsg = $$props.successMsg;
    		if ("newsletterSuccess" in $$props) $$invalidate(1, newsletterSuccess = $$props.newsletterSuccess);
    		if ("newsletterMsg" in $$props) $$invalidate(2, newsletterMsg = $$props.newsletterMsg);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		email,
    		newsletterSuccess,
    		newsletterMsg,
    		$_,
    		handleSubmit,
    		onInputChange,
    		input_input_handler
    	];
    }

    class Footer extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Footer",
    			options,
    			id: create_fragment$7.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.29.0 */
    const file$8 = "src/App.svelte";

    // (35:0) {#if $isLocaleLoaded}
    function create_if_block$3(ctx) {
    	let header;
    	let t0;
    	let main;
    	let switch_instance;
    	let t1;
    	let footer;
    	let current;

    	header = new Header({
    			props: {
    				page: /*page*/ ctx[0],
    				handleClickNavigation: /*handleClickNavigation*/ ctx[3]
    			},
    			$$inline: true
    		});

    	var switch_value = /*components*/ ctx[2][/*page*/ ctx[0]];

    	function switch_props(ctx) {
    		return {
    			props: {
    				handleClickNavigation: /*handleClickNavigation*/ ctx[3]
    			},
    			$$inline: true
    		};
    	}

    	if (switch_value) {
    		switch_instance = new switch_value(switch_props(ctx));
    	}

    	footer = new Footer({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(header.$$.fragment);
    			t0 = space();
    			main = element("main");
    			if (switch_instance) create_component(switch_instance.$$.fragment);
    			t1 = space();
    			create_component(footer.$$.fragment);
    			add_location(main, file$8, 36, 2, 1033);
    		},
    		m: function mount(target, anchor) {
    			mount_component(header, target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, main, anchor);

    			if (switch_instance) {
    				mount_component(switch_instance, main, null);
    			}

    			insert_dev(target, t1, anchor);
    			mount_component(footer, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const header_changes = {};
    			if (dirty & /*page*/ 1) header_changes.page = /*page*/ ctx[0];
    			header.$set(header_changes);

    			if (switch_value !== (switch_value = /*components*/ ctx[2][/*page*/ ctx[0]])) {
    				if (switch_instance) {
    					group_outros();
    					const old_component = switch_instance;

    					transition_out(old_component.$$.fragment, 1, 0, () => {
    						destroy_component(old_component, 1);
    					});

    					check_outros();
    				}

    				if (switch_value) {
    					switch_instance = new switch_value(switch_props(ctx));
    					create_component(switch_instance.$$.fragment);
    					transition_in(switch_instance.$$.fragment, 1);
    					mount_component(switch_instance, main, null);
    				} else {
    					switch_instance = null;
    				}
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(header.$$.fragment, local);
    			if (switch_instance) transition_in(switch_instance.$$.fragment, local);
    			transition_in(footer.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(header.$$.fragment, local);
    			if (switch_instance) transition_out(switch_instance.$$.fragment, local);
    			transition_out(footer.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(header, detaching);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(main);
    			if (switch_instance) destroy_component(switch_instance);
    			if (detaching) detach_dev(t1);
    			destroy_component(footer, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(35:0) {#if $isLocaleLoaded}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*$isLocaleLoaded*/ ctx[1] && create_if_block$3(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$isLocaleLoaded*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*$isLocaleLoaded*/ 2) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block$3(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let $isLocaleLoaded;
    	validate_store(isLocaleLoaded, "isLocaleLoaded");
    	component_subscribe($$self, isLocaleLoaded, $$value => $$invalidate(1, $isLocaleLoaded = $$value));
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	setupI18n({ withLocale: F() });

    	const components = {
    		[pages.home]: Home,
    		[pages.app]: Lemmi,
    		[pages.about]: About,
    		[pages.pricing]: Pricing,
    		[pages.faqs]: FAQs,
    		[pages.contact]: Contact
    	};

    	let page = pages.home;

    	let handleClickNavigation = (selected, scrollToTop = false) => {
    		$$invalidate(0, page = selected);

    		if (scrollToTop) {
    			window.scrollTo(0, 0);
    		}
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		getLocaleFromNavigator: F,
    		setupI18n,
    		isLocaleLoaded,
    		Header,
    		Home,
    		Lemmi,
    		About,
    		Pricing,
    		FAQs,
    		Contact,
    		Footer,
    		pages,
    		components,
    		page,
    		handleClickNavigation,
    		$isLocaleLoaded
    	});

    	$$self.$inject_state = $$props => {
    		if ("page" in $$props) $$invalidate(0, page = $$props.page);
    		if ("handleClickNavigation" in $$props) $$invalidate(3, handleClickNavigation = $$props.handleClickNavigation);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [page, $isLocaleLoaded, components, handleClickNavigation];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    const app = new App({
      target: document.body
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
