
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

    const hero = {
      title: "Lemmi",
      subtitle: "The assistive app that lets you chat!",
      description: "Discover a world of possibilities with this customisable speech app that gives you the independence to take part in conversations wherever you are, with or without a network connection.",
    };

    const home = {
      freetrial: {
        title: "Get a weeks FREE trial",
        subtitle: "Enjoy our ad-free personalisable, speech app.",
        button: "Get 1 week free",
        desciption: "From only £3.50/month on a yearly plan. Terms of Service apply.",
        images: ["images/chat.png", "images/personalise.png", "images/save-time.png", "images/simple-to-use.png", "images/customise.png"]
      },
      blurb: {
        text1: "Discover a world of possibilities with this unique text-to-speech (AAC) app that gives users a voice of their own.",
        text2: "Lemmi enables users the freedom and independence to fully take part in conversations and to share thoughts and needs clearly with others.",
        action: "SHOW ME HOW"
      },
      help: {
        title: "Lemmi helps you...",
        usps: [
          {
            image: '/images/communicate-with-ease.svg',
            title: "Communicate with ease",
            description: "Type your own words or select from over 600 other options which the app will read aloud.",
          },
          {
            image: '/images/keep-up-with-conversations.svg',
            title: "Keep up with conversations",
            description: "Suggested word prompts are shown to help keep your conversations flowing.",
          },
          {
            image: '/images/no-wifi.svg',
            title: "No connection necessary",
            description: "Once downloaded, Lemmi does not require an internet connection for you to communicate with others.",
          },
        ]
      },
      anatomy: [
        {
          title: "Predictive Words",
          desciption: "Suggested words appear to help you form phrases faster",
          image: "/images/predictive.svg"
        },
        {
          title: "Word Book",
          desciption: "Access word categories and add custom entries",
          image: "/images/book.svg"
        },
        {
          title: "Settings",
          desciption: "Customise the app, manage your subscription, and get help",
          image: "/images/settings.svg"
        },
        {
          title: "Connectivity",
          desciption: "Once downloaded, available anytime, anywhere",
          image: "/images/no-wifi.svg"
        },
        {
          title: "Play",
          desciption: "Tap for the text in the speech bar to be read aloud",
          image: "/images/play.svg"
        },
        {
          title: "Core Words",
          desciption: "Quick access core words such as 'Yes' and 'Please'",
          image: "/images/plus.svg"
        },
      ]
    };

    const about = {
      story: {
        title: "The Story of Lemmi",
        heading: "Our goal is to give users a voice; to help build their confidence and independence, and to keep them connected.",
        sections: [
          [
            "The original idea for Lemmi arose after, co-founder, Jemma helped care for a loved one who developed aphasia after suffering a serious stroke.",
            "Having witnessed, first-hand, the devastating impact that a speech impairment can have on an individual’s confidence and overall well-being, Jemma set out to create an accessible and user-friendly resource that could help others who might, for any reason, struggle to xpress themselves verbally.",
            "Following a conversation with Will (Jemma's close friend and software developer), the idea of developing of an assistive app took shape."
          ],
          [
            "Together, Jemma and Will spent the next few years learning about the world of AAC, researching what potential users would find most helpful. Their vision was to develop the best all-round communication app available for anyone with any form of aphasia or speech impairment.",
            "After years of perfecting the design, their newly created app - Lemmi - is now available on iOS and Android."
          ],
          [
            "Lemmi has been a passion project for both co-founders, who hope that it will provide a lifeline for anyone struggling with speech by providing a tool to communicate more easily and confidently with their friends, family and day-to-day contacts.",
            "The Lemmi app is continually being updated in response to customer's feedback, so please do not hesitate to let us know of any ways you think the app could be improved further. We greatly appreciate and value all feedback given, and will do our best to respond to everyone's comments and ideas."
          ]
        ]
      },
      team: {
        title: "The Team",
        people: [{
          name: "Jemma Grace",
          image: "images/jemma-bowles.jpg",
          role: "Co-founder"
        }, {
          name: "Will Nixon",
          image: "images/will-nixon.jpg",
          role: "Co-founder"
        }]
      }
    };

    const contact = {
      title: "Contact Us",
      instructions: "Lemmi is continually being revised in response to customer's feedback, so please do not hesitate to get in touch with any questions or to let us know of any ways you think the app could be improved further.",
      form: "Get in touch",
      notes: "We greate appreciate and value all feedback given, and will do our best to respond to everyone's comments and ideas.",
      submit: "Submit",
      success: "Your form has been submitted!",
      error: "There was an issue submitting your form. Please try again or email as: info@lemmichat.com"
    };

    const app = {
      header: "Lemmi offers users a range of exciting functions and personalised possibilities",
      features: [
        {
          title: "Chat",
          description: "Users can type their own words or select from over 600+ words and phrases which the app will read aloud.",
          image: "images/chat.png"
        },
        {
          title: "Personalise",
          description: "Add unlimited custom words, sentences, and photos. The ability to add familiar faces and phrases can help provide visual prompts and bring the app to life.",
          image: "images/personalise.png"
        },
        {
          title: "Save time",
          description: "Suggested word prompts are shown under the speech bar. These are automated phrases, or words that have been previously used in succession, and are a great way to keep the conversation flowing.",
          image: "images/save-time.png"
        },
        {
          title: "Simple to use",
          description: "The app has a user friendly design (including a clear menu, easy navigation, and simple graphics) making it suitable for all ages and abilities.",
          image: "images/simple-to-use.png"
        },
        {
          title: "Customise",
          description: "The app can be adapted to suit individual needs by changing the setting options (e.g. tone of voice, colour theme, and more).",
          image: "images/customise.png"
        },
      ]
    };

    const pricing = {
      title: "Pricing",
      subscription: "We offer two subscription plans:",
      plans: [
        {
          title: "Monthly",
          price: "£4.49 per month",
        },
        {
          title: "Yearly",
          price: "£41.99 per year",
          perMonth: "(Just £3.50 per month!)",
          save: "Save 22%",
          popular: "Most Popular"
        }
      ],
      billing: "Billed after 7 day FREE trial",
      whatsIncluded: "What's included?",
      included: [
        "Available offline - once downloaded, Lemmi does not require an internet connection",
        "Extensive word options - over 600+ words and phrases included",
        "Personalised - users can add unlimited personal words and images",
        "Private - bespoke entries are stored privately on the user's private account",
        "Phone calls - Lemmi can be used during phone conversations (iOS 13+ only)",
        "Language options - English with additional languages coming soon",
        "Regular updated - including new features, words, phrases, and icons"
      ],
      available: "Available on iOS and Android devices"
    };

    const actions = {
      newsletter: {
        heading: "Keep up to date with Lemmi's latest updates and offers",
        button: "Subscribe",
        success: "You have been successfully subscribed!",
        error: "Something went wrong - please check your email and try again. If you continue to have difficulties, please reach out on our contact page."
      }
    };

    const links = {
      email: "mailto:info@lemmichat.com?subject=New Contact from Website",
      twitter: "https://twitter.com/lemmichat",
      facebook: "https://www.facebook.com/lemmichat",
      instagram: "https://www.instagram.com/lemmichat"
    };

    const pages = {
      home: 'Home',
      app: 'App',
      about: 'About',
      pricing: 'Pricing',
      faqs: 'FAQs',
      contact: 'Contact'
    };

    /* src/components/Header.svelte generated by Svelte v3.29.0 */

    const { Object: Object_1, console: console_1 } = globals;
    const file = "src/components/Header.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	return child_ctx;
    }

    // (47:4) {#each Object.values(pages) as pageTitle}
    function create_each_block_1(ctx) {
    	let li;
    	let button;
    	let t0_value = /*pageTitle*/ ctx[7] + "";
    	let t0;
    	let button_class_value;
    	let t1;
    	let mounted;
    	let dispose;

    	function click_handler_2(...args) {
    		return /*click_handler_2*/ ctx[5](/*pageTitle*/ ctx[7], ...args);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			button = element("button");
    			t0 = text(t0_value);
    			t1 = space();

    			attr_dev(button, "class", button_class_value = "" + (null_to_empty(`${/*page*/ ctx[0] === /*pageTitle*/ ctx[7]
			? "selected"
			: ""}`) + " svelte-fi00bi"));

    			add_location(button, file, 48, 8, 1137);
    			add_location(li, file, 47, 6, 1124);
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

    			if (dirty & /*page*/ 1 && button_class_value !== (button_class_value = "" + (null_to_empty(`${/*page*/ ctx[0] === /*pageTitle*/ ctx[7]
			? "selected"
			: ""}`) + " svelte-fi00bi"))) {
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
    		source: "(47:4) {#each Object.values(pages) as pageTitle}",
    		ctx
    	});

    	return block;
    }

    // (59:4) {#each Object.values(pages) as pageTitle}
    function create_each_block(ctx) {
    	let li;
    	let button;
    	let t0_value = /*pageTitle*/ ctx[7] + "";
    	let t0;
    	let button_class_value;
    	let t1;
    	let mounted;
    	let dispose;

    	function click_handler_3(...args) {
    		return /*click_handler_3*/ ctx[6](/*pageTitle*/ ctx[7], ...args);
    	}

    	const block = {
    		c: function create() {
    			li = element("li");
    			button = element("button");
    			t0 = text(t0_value);
    			t1 = space();

    			attr_dev(button, "class", button_class_value = "" + (null_to_empty(`${/*page*/ ctx[0] === /*pageTitle*/ ctx[7]
			? "selected"
			: ""}`) + " svelte-fi00bi"));

    			add_location(button, file, 60, 8, 1431);
    			add_location(li, file, 59, 6, 1418);
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

    			if (dirty & /*page*/ 1 && button_class_value !== (button_class_value = "" + (null_to_empty(`${/*page*/ ctx[0] === /*pageTitle*/ ctx[7]
			? "selected"
			: ""}`) + " svelte-fi00bi"))) {
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
    		source: "(59:4) {#each Object.values(pages) as pageTitle}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let header;
    	let img0;
    	let img0_src_value;
    	let t0;
    	let img1;
    	let img1_src_value;
    	let t1;
    	let section;
    	let h1;
    	let t3;
    	let h3;
    	let t5;
    	let div;
    	let button0;
    	let img2;
    	let img2_src_value;
    	let t6;
    	let button1;
    	let img3;
    	let img3_src_value;
    	let t7;
    	let nav0;
    	let ul0;
    	let t8;
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

    	let each_value = Object.values(pages);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			header = element("header");
    			img0 = element("img");
    			t0 = space();
    			img1 = element("img");
    			t1 = space();
    			section = element("section");
    			h1 = element("h1");
    			h1.textContent = `${hero.title}`;
    			t3 = space();
    			h3 = element("h3");
    			h3.textContent = `${hero.subtitle}`;
    			t5 = space();
    			div = element("div");
    			button0 = element("button");
    			img2 = element("img");
    			t6 = space();
    			button1 = element("button");
    			img3 = element("img");
    			t7 = space();
    			nav0 = element("nav");
    			ul0 = element("ul");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t8 = space();
    			nav1 = element("nav");
    			ul1 = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(img0, "class", "mobile-hero-image svelte-fi00bi");
    			if (img0.src !== (img0_src_value = "images/appIcon.svg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "Lemmi Logo");
    			add_location(img0, file, 15, 2, 268);
    			attr_dev(img1, "class", "hero-image svelte-fi00bi");
    			if (img1.src !== (img1_src_value = "images/hero-image.png")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "Lemmi shown on an iPad and iPhone");
    			add_location(img1, file, 16, 2, 346);
    			attr_dev(h1, "class", "title svelte-fi00bi");
    			add_location(h1, file, 22, 4, 489);
    			attr_dev(h3, "class", "subtitle svelte-fi00bi");
    			add_location(h3, file, 23, 4, 529);
    			attr_dev(img2, "class", "app-icon svelte-fi00bi");
    			if (img2.src !== (img2_src_value = "images/app-store.png")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "alt", "Download on the App Store");
    			add_location(img2, file, 28, 8, 673);
    			attr_dev(button0, "class", "svelte-fi00bi");
    			add_location(button0, file, 25, 6, 607);
    			attr_dev(img3, "class", "play-icon svelte-fi00bi");
    			if (img3.src !== (img3_src_value = "images/play-store.png")) attr_dev(img3, "src", img3_src_value);
    			attr_dev(img3, "alt", "Download on the Play Store");
    			add_location(img3, file, 36, 8, 876);
    			attr_dev(button1, "class", "svelte-fi00bi");
    			add_location(button1, file, 33, 6, 809);
    			attr_dev(div, "class", "store-icons svelte-fi00bi");
    			add_location(div, file, 24, 4, 575);
    			attr_dev(section, "class", "hero-info svelte-fi00bi");
    			add_location(section, file, 21, 2, 457);
    			attr_dev(header, "class", "svelte-fi00bi");
    			add_location(header, file, 14, 0, 257);
    			attr_dev(ul0, "class", "svelte-fi00bi");
    			add_location(ul0, file, 45, 2, 1067);
    			attr_dev(nav0, "class", "nav-bar svelte-fi00bi");
    			add_location(nav0, file, 44, 0, 1043);
    			add_location(ul1, file, 57, 2, 1361);
    			attr_dev(nav1, "class", "mobile-nav svelte-fi00bi");
    			add_location(nav1, file, 56, 0, 1334);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, img0);
    			append_dev(header, t0);
    			append_dev(header, img1);
    			append_dev(header, t1);
    			append_dev(header, section);
    			append_dev(section, h1);
    			append_dev(section, t3);
    			append_dev(section, h3);
    			append_dev(section, t5);
    			append_dev(section, div);
    			append_dev(div, button0);
    			append_dev(button0, img2);
    			append_dev(div, t6);
    			append_dev(div, button1);
    			append_dev(button1, img3);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, nav0, anchor);
    			append_dev(nav0, ul0);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(ul0, null);
    			}

    			insert_dev(target, t8, anchor);
    			insert_dev(target, nav1, anchor);
    			append_dev(nav1, ul1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul1, null);
    			}

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[3], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[4], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
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

    			if (dirty & /*page, Object, pages, handleClickNavigation*/ 3) {
    				each_value = Object.values(pages);
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
    			if (detaching) detach_dev(t7);
    			if (detaching) detach_dev(nav0);
    			destroy_each(each_blocks_1, detaching);
    			if (detaching) detach_dev(t8);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Header", slots, []);
    	let { page } = $$props;
    	let { handleClickNavigation } = $$props;

    	const openStore = store => {
    		if (store === "app") {
    			console.log("app");
    		} else {
    			console.log("play");
    		}
    	};

    	const writable_props = ["page", "handleClickNavigation"];

    	Object_1.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Header> was created with unknown prop '${key}'`);
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
    		hero,
    		pages,
    		page,
    		handleClickNavigation,
    		openStore
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
    			console_1.warn("<Header> was created without expected prop 'page'");
    		}

    		if (/*handleClickNavigation*/ ctx[1] === undefined && !("handleClickNavigation" in props)) {
    			console_1.warn("<Header> was created without expected prop 'handleClickNavigation'");
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
    	child_ctx[8] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[13] = list[i];
    	return child_ctx;
    }

    function get_each_context_3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[16] = list[i];
    	child_ctx[18] = i;
    	return child_ctx;
    }

    // (307:10) {#if index == carouselIndex}
    function create_if_block(ctx) {
    	let img;
    	let img_src_value;

    	const block = {
    		c: function create() {
    			img = element("img");
    			if (img.src !== (img_src_value = /*photo*/ ctx[16])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "Screenshot of Lemmi running on iOS");
    			attr_dev(img, "class", "svelte-18uvj28");
    			add_location(img, file$1, 307, 12, 5620);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, img, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(img);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(307:10) {#if index == carouselIndex}",
    		ctx
    	});

    	return block;
    }

    // (306:8) {#each freetrial.images as photo, index}
    function create_each_block_3(ctx) {
    	let if_block_anchor;
    	let if_block = /*index*/ ctx[18] == /*carouselIndex*/ ctx[1] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*index*/ ctx[18] == /*carouselIndex*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_3.name,
    		type: "each",
    		source: "(306:8) {#each freetrial.images as photo, index}",
    		ctx
    	});

    	return block;
    }

    // (327:4) {#each help.usps as usp}
    function create_each_block_2(ctx) {
    	let div1;
    	let div0;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t0;
    	let p0;
    	let t1_value = /*usp*/ ctx[13].title.toUpperCase() + "";
    	let t1;
    	let t2;
    	let p1;
    	let t3_value = /*usp*/ ctx[13].description + "";
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
    			if (img.src !== (img_src_value = /*usp*/ ctx[13].image)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*usp*/ ctx[13].title);
    			attr_dev(img, "class", "svelte-18uvj28");
    			add_location(img, file$1, 329, 10, 6251);
    			attr_dev(div0, "class", "usp-image-wrapper svelte-18uvj28");
    			add_location(div0, file$1, 328, 8, 6209);
    			attr_dev(p0, "class", "usp-title svelte-18uvj28");
    			add_location(p0, file$1, 331, 8, 6314);
    			attr_dev(p1, "class", "usp-description svelte-18uvj28");
    			add_location(p1, file$1, 332, 8, 6373);
    			attr_dev(div1, "class", "usp svelte-18uvj28");
    			add_location(div1, file$1, 327, 6, 6183);
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
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(327:4) {#each help.usps as usp}",
    		ctx
    	});

    	return block;
    }

    // (342:6) {#each anatomy.slice(0, 3) as item}
    function create_each_block_1$1(ctx) {
    	let div1;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t0;
    	let div0;
    	let p0;
    	let t1_value = /*item*/ ctx[8].title.toUpperCase() + "";
    	let t1;
    	let t2;
    	let p1;
    	let t3_value = /*item*/ ctx[8].desciption + "";
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
    			if (img.src !== (img_src_value = /*item*/ ctx[8].image)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*item*/ ctx[8].title);
    			attr_dev(img, "class", "svelte-18uvj28");
    			add_location(img, file$1, 343, 10, 6713);
    			add_location(p0, file$1, 345, 12, 6804);
    			add_location(p1, file$1, 346, 12, 6850);
    			attr_dev(div0, "class", "anatomy-text svelte-18uvj28");
    			add_location(div0, file$1, 344, 10, 6765);
    			attr_dev(div1, "class", "anatomy-item reversed svelte-18uvj28");
    			add_location(div1, file$1, 342, 8, 6667);
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
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(342:6) {#each anatomy.slice(0, 3) as item}",
    		ctx
    	});

    	return block;
    }

    // (356:6) {#each anatomy.slice(3, anatomy.length) as item}
    function create_each_block$1(ctx) {
    	let div1;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t0;
    	let div0;
    	let p0;
    	let t1_value = /*item*/ ctx[8].title.toUpperCase() + "";
    	let t1;
    	let t2;
    	let p1;
    	let t3_value = /*item*/ ctx[8].desciption + "";
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
    			if (img.src !== (img_src_value = /*item*/ ctx[8].image)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = /*item*/ ctx[8].title);
    			attr_dev(img, "class", "svelte-18uvj28");
    			add_location(img, file$1, 357, 10, 7221);
    			add_location(p0, file$1, 359, 12, 7312);
    			add_location(p1, file$1, 360, 12, 7358);
    			attr_dev(div0, "class", "anatomy-text svelte-18uvj28");
    			add_location(div0, file$1, 358, 10, 7273);
    			attr_dev(div1, "class", "anatomy-item svelte-18uvj28");
    			add_location(div1, file$1, 356, 8, 7184);
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
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(356:6) {#each anatomy.slice(3, anatomy.length) as item}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let section0;
    	let div3;
    	let div0;
    	let h2;
    	let t1;
    	let p0;
    	let t3;
    	let button0;
    	let t5;
    	let p1;
    	let t7;
    	let div2;
    	let div1;
    	let button1;
    	let img0;
    	let img0_src_value;
    	let t8;
    	let t9;
    	let button2;
    	let img1;
    	let img1_src_value;
    	let t10;
    	let section1;
    	let p2;
    	let t12;
    	let p3;
    	let t14;
    	let button3;
    	let t16;
    	let section2;
    	let h3;
    	let t18;
    	let div4;
    	let t19;
    	let section3;
    	let div8;
    	let img2;
    	let img2_src_value;
    	let t20;
    	let div5;
    	let t21;
    	let div6;
    	let img3;
    	let img3_src_value;
    	let t22;
    	let div7;
    	let mounted;
    	let dispose;
    	let each_value_3 = /*freetrial*/ ctx[2].images;
    	validate_each_argument(each_value_3);
    	let each_blocks_3 = [];

    	for (let i = 0; i < each_value_3.length; i += 1) {
    		each_blocks_3[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
    	}

    	let each_value_2 = /*help*/ ctx[4].usps;
    	validate_each_argument(each_value_2);
    	let each_blocks_2 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_2[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	let each_value_1 = /*anatomy*/ ctx[5].slice(0, 3);
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1$1(get_each_context_1$1(ctx, each_value_1, i));
    	}

    	let each_value = /*anatomy*/ ctx[5].slice(3, /*anatomy*/ ctx[5].length);
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			section0 = element("section");
    			div3 = element("div");
    			div0 = element("div");
    			h2 = element("h2");
    			h2.textContent = `${/*freetrial*/ ctx[2].title}`;
    			t1 = space();
    			p0 = element("p");
    			p0.textContent = `${/*freetrial*/ ctx[2].subtitle}`;
    			t3 = space();
    			button0 = element("button");
    			button0.textContent = "Get 1 week free";
    			t5 = space();
    			p1 = element("p");
    			p1.textContent = `${/*freetrial*/ ctx[2].desciption}`;
    			t7 = space();
    			div2 = element("div");
    			div1 = element("div");
    			button1 = element("button");
    			img0 = element("img");
    			t8 = space();

    			for (let i = 0; i < each_blocks_3.length; i += 1) {
    				each_blocks_3[i].c();
    			}

    			t9 = space();
    			button2 = element("button");
    			img1 = element("img");
    			t10 = space();
    			section1 = element("section");
    			p2 = element("p");
    			p2.textContent = `${/*blurb*/ ctx[3].text1}`;
    			t12 = space();
    			p3 = element("p");
    			p3.textContent = `${/*blurb*/ ctx[3].text2}`;
    			t14 = space();
    			button3 = element("button");
    			button3.textContent = `${/*blurb*/ ctx[3].action}`;
    			t16 = space();
    			section2 = element("section");
    			h3 = element("h3");
    			h3.textContent = `${/*help*/ ctx[4].title}`;
    			t18 = space();
    			div4 = element("div");

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].c();
    			}

    			t19 = space();
    			section3 = element("section");
    			div8 = element("div");
    			img2 = element("img");
    			t20 = space();
    			div5 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t21 = space();
    			div6 = element("div");
    			img3 = element("img");
    			t22 = space();
    			div7 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(h2, "class", "svelte-18uvj28");
    			add_location(h2, file$1, 295, 6, 5054);
    			attr_dev(p0, "class", "svelte-18uvj28");
    			add_location(p0, file$1, 296, 6, 5087);
    			attr_dev(button0, "class", "svelte-18uvj28");
    			add_location(button0, file$1, 297, 6, 5121);
    			attr_dev(p1, "class", "home-freetrial__smallprint svelte-18uvj28");
    			add_location(p1, file$1, 298, 6, 5208);
    			attr_dev(div0, "class", "home-freetrial__text svelte-18uvj28");
    			add_location(div0, file$1, 294, 4, 5013);
    			if (img0.src !== (img0_src_value = "./images/chevron-left.svg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "View previous screenshot");
    			attr_dev(img0, "class", "svelte-18uvj28");
    			add_location(img0, file$1, 303, 10, 5431);
    			attr_dev(button1, "class", "carousel_prev svelte-18uvj28");
    			add_location(button1, file$1, 302, 8, 5370);
    			if (img1.src !== (img1_src_value = "./images/chevron-right.svg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "View next screenshot");
    			attr_dev(img1, "class", "svelte-18uvj28");
    			add_location(img1, file$1, 311, 10, 5778);
    			attr_dev(button2, "class", "carousel_next svelte-18uvj28");
    			add_location(button2, file$1, 310, 8, 5721);
    			attr_dev(div1, "class", "carousel_image svelte-18uvj28");
    			add_location(div1, file$1, 301, 6, 5333);
    			attr_dev(div2, "class", "home-freetrial__carousel svelte-18uvj28");
    			add_location(div2, file$1, 300, 4, 5288);
    			attr_dev(div3, "class", "wrapper svelte-18uvj28");
    			add_location(div3, file$1, 293, 2, 4987);
    			attr_dev(section0, "class", "home-freetrial svelte-18uvj28");
    			add_location(section0, file$1, 292, 0, 4952);
    			attr_dev(p2, "class", "svelte-18uvj28");
    			add_location(p2, file$1, 318, 2, 5934);
    			attr_dev(p3, "class", "svelte-18uvj28");
    			add_location(p3, file$1, 319, 2, 5957);
    			attr_dev(button3, "class", "svelte-18uvj28");
    			add_location(button3, file$1, 320, 2, 5980);
    			attr_dev(section1, "class", "blurb svelte-18uvj28");
    			add_location(section1, file$1, 317, 0, 5908);
    			attr_dev(h3, "class", "svelte-18uvj28");
    			add_location(h3, file$1, 324, 2, 6098);
    			attr_dev(div4, "class", "usp-wrapper svelte-18uvj28");
    			add_location(div4, file$1, 325, 2, 6122);
    			attr_dev(section2, "class", "help svelte-18uvj28");
    			add_location(section2, file$1, 323, 0, 6073);
    			if (img2.src !== (img2_src_value = "images/anatomy.png")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "alt", "Anatomy of the Lemmi app");
    			attr_dev(img2, "class", "svelte-18uvj28");
    			add_location(img2, file$1, 339, 4, 6521);
    			attr_dev(div5, "class", "anatomy-wrapper svelte-18uvj28");
    			add_location(div5, file$1, 340, 4, 6587);
    			attr_dev(img3, "class", "mock-up svelte-18uvj28");
    			if (img3.src !== (img3_src_value = "/images/save-time.png")) attr_dev(img3, "src", img3_src_value);
    			attr_dev(img3, "alt", "Lemmi showing the phrase 'I want to go to the'");
    			add_location(img3, file$1, 352, 6, 6972);
    			attr_dev(div6, "class", "mock-up-wrapper svelte-18uvj28");
    			add_location(div6, file$1, 351, 4, 6936);
    			attr_dev(div7, "class", "anatomy-wrapper svelte-18uvj28");
    			add_location(div7, file$1, 354, 4, 7091);
    			attr_dev(div8, "class", "wrapper svelte-18uvj28");
    			add_location(div8, file$1, 338, 2, 6495);
    			attr_dev(section3, "class", "anatomy svelte-18uvj28");
    			add_location(section3, file$1, 337, 0, 6467);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section0, anchor);
    			append_dev(section0, div3);
    			append_dev(div3, div0);
    			append_dev(div0, h2);
    			append_dev(div0, t1);
    			append_dev(div0, p0);
    			append_dev(div0, t3);
    			append_dev(div0, button0);
    			append_dev(div0, t5);
    			append_dev(div0, p1);
    			append_dev(div3, t7);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			append_dev(div1, button1);
    			append_dev(button1, img0);
    			append_dev(div1, t8);

    			for (let i = 0; i < each_blocks_3.length; i += 1) {
    				each_blocks_3[i].m(div1, null);
    			}

    			append_dev(div1, t9);
    			append_dev(div1, button2);
    			append_dev(button2, img1);
    			insert_dev(target, t10, anchor);
    			insert_dev(target, section1, anchor);
    			append_dev(section1, p2);
    			append_dev(section1, t12);
    			append_dev(section1, p3);
    			append_dev(section1, t14);
    			append_dev(section1, button3);
    			insert_dev(target, t16, anchor);
    			insert_dev(target, section2, anchor);
    			append_dev(section2, h3);
    			append_dev(section2, t18);
    			append_dev(section2, div4);

    			for (let i = 0; i < each_blocks_2.length; i += 1) {
    				each_blocks_2[i].m(div4, null);
    			}

    			insert_dev(target, t19, anchor);
    			insert_dev(target, section3, anchor);
    			append_dev(section3, div8);
    			append_dev(div8, img2);
    			append_dev(div8, t20);
    			append_dev(div8, div5);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div5, null);
    			}

    			append_dev(div8, t21);
    			append_dev(div8, div6);
    			append_dev(div6, img3);
    			append_dev(div8, t22);
    			append_dev(div8, div7);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div7, null);
    			}

    			if (!mounted) {
    				dispose = [
    					listen_dev(
    						button0,
    						"click",
    						function () {
    							if (is_function(/*handleClickNavigation*/ ctx[0](pages.pricing))) /*handleClickNavigation*/ ctx[0](pages.pricing).apply(this, arguments);
    						},
    						false,
    						false,
    						false
    					),
    					listen_dev(button1, "click", /*previous*/ ctx[7], false, false, false),
    					listen_dev(button2, "click", /*next*/ ctx[6], false, false, false),
    					listen_dev(
    						button3,
    						"click",
    						function () {
    							if (is_function(/*handleClickNavigation*/ ctx[0](pages.faqs))) /*handleClickNavigation*/ ctx[0](pages.faqs).apply(this, arguments);
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

    			if (dirty & /*freetrial, carouselIndex*/ 6) {
    				each_value_3 = /*freetrial*/ ctx[2].images;
    				validate_each_argument(each_value_3);
    				let i;

    				for (i = 0; i < each_value_3.length; i += 1) {
    					const child_ctx = get_each_context_3(ctx, each_value_3, i);

    					if (each_blocks_3[i]) {
    						each_blocks_3[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_3[i] = create_each_block_3(child_ctx);
    						each_blocks_3[i].c();
    						each_blocks_3[i].m(div1, t9);
    					}
    				}

    				for (; i < each_blocks_3.length; i += 1) {
    					each_blocks_3[i].d(1);
    				}

    				each_blocks_3.length = each_value_3.length;
    			}

    			if (dirty & /*help*/ 16) {
    				each_value_2 = /*help*/ ctx[4].usps;
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks_2[i]) {
    						each_blocks_2[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_2[i] = create_each_block_2(child_ctx);
    						each_blocks_2[i].c();
    						each_blocks_2[i].m(div4, null);
    					}
    				}

    				for (; i < each_blocks_2.length; i += 1) {
    					each_blocks_2[i].d(1);
    				}

    				each_blocks_2.length = each_value_2.length;
    			}

    			if (dirty & /*anatomy*/ 32) {
    				each_value_1 = /*anatomy*/ ctx[5].slice(0, 3);
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

    			if (dirty & /*anatomy*/ 32) {
    				each_value = /*anatomy*/ ctx[5].slice(3, /*anatomy*/ ctx[5].length);
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div7, null);
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
    			destroy_each(each_blocks_3, detaching);
    			if (detaching) detach_dev(t10);
    			if (detaching) detach_dev(section1);
    			if (detaching) detach_dev(t16);
    			if (detaching) detach_dev(section2);
    			destroy_each(each_blocks_2, detaching);
    			if (detaching) detach_dev(t19);
    			if (detaching) detach_dev(section3);
    			destroy_each(each_blocks_1, detaching);
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

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Home", slots, []);
    	const { freetrial, blurb, help, anatomy } = home;
    	let carouselIndex = 0;
    	const next = () => $$invalidate(1, carouselIndex = (carouselIndex + 1) % freetrial.images.length);
    	const previous = () => $$invalidate(1, carouselIndex = (carouselIndex - 1) % freetrial.images.length);
    	let { handleClickNavigation } = $$props;
    	const writable_props = ["handleClickNavigation"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Home> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("handleClickNavigation" in $$props) $$invalidate(0, handleClickNavigation = $$props.handleClickNavigation);
    	};

    	$$self.$capture_state = () => ({
    		home,
    		pages,
    		freetrial,
    		blurb,
    		help,
    		anatomy,
    		carouselIndex,
    		next,
    		previous,
    		handleClickNavigation
    	});

    	$$self.$inject_state = $$props => {
    		if ("carouselIndex" in $$props) $$invalidate(1, carouselIndex = $$props.carouselIndex);
    		if ("handleClickNavigation" in $$props) $$invalidate(0, handleClickNavigation = $$props.handleClickNavigation);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		handleClickNavigation,
    		carouselIndex,
    		freetrial,
    		blurb,
    		help,
    		anatomy,
    		next,
    		previous
    	];
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
    	child_ctx[0] = list[i].title;
    	child_ctx[1] = list[i].description;
    	child_ctx[2] = list[i].image;
    	child_ctx[4] = i;
    	return child_ctx;
    }

    // (67:2) {#each app.features as { title, description, image }
    function create_each_block$2(ctx) {
    	let div1;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t0;
    	let div0;
    	let h3;
    	let t1_value = /*title*/ ctx[0] + "";
    	let t1;
    	let t2;
    	let p;
    	let t3_value = /*description*/ ctx[1] + "";
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
    			attr_dev(img, "class", "feature-image svelte-18fsojo");
    			if (img.src !== (img_src_value = /*image*/ ctx[2])) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = "" + (/*title*/ ctx[0] + " image"));
    			add_location(img, file$2, 68, 6, 1221);
    			attr_dev(h3, "class", "feature-title svelte-18fsojo");
    			add_location(h3, file$2, 73, 8, 1348);
    			attr_dev(p, "class", "feature-description svelte-18fsojo");
    			add_location(p, file$2, 74, 8, 1395);
    			attr_dev(div0, "class", "text-wrapper svelte-18fsojo");
    			add_location(div0, file$2, 72, 6, 1313);
    			attr_dev(div1, "class", "feature svelte-18fsojo");
    			toggle_class(div1, "right", /*index*/ ctx[4] % 2 !== 0);
    			add_location(div1, file$2, 67, 4, 1163);
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
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(67:2) {#each app.features as { title, description, image }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div;
    	let h3;
    	let t1;
    	let section;
    	let each_value = app.features;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$2(get_each_context$2(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			h3 = element("h3");
    			h3.textContent = `${app.header.toUpperCase()}`;
    			t1 = space();
    			section = element("section");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(h3, "class", "svelte-18fsojo");
    			add_location(h3, file$2, 63, 2, 1026);
    			attr_dev(div, "class", "lemmi-title svelte-18fsojo");
    			add_location(div, file$2, 62, 0, 998);
    			attr_dev(section, "class", "features svelte-18fsojo");
    			add_location(section, file$2, 65, 0, 1069);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, h3);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, section, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(section, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*app*/ 0) {
    				each_value = app.features;
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Lemmi", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Lemmi> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ app });
    	return [];
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
    	child_ctx[2] = list[i];
    	return child_ctx;
    }

    function get_each_context_2$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    // (96:6) {#each section as paragraph}
    function create_each_block_2$1(ctx) {
    	let p;
    	let t_value = /*paragraph*/ ctx[8] + "";
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(t_value);
    			attr_dev(p, "class", "svelte-192jlo4");
    			add_location(p, file$3, 96, 8, 1659);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2$1.name,
    		type: "each",
    		source: "(96:6) {#each section as paragraph}",
    		ctx
    	});

    	return block;
    }

    // (94:2) {#each story.sections as section}
    function create_each_block_1$2(ctx) {
    	let section;
    	let t;
    	let each_value_2 = /*section*/ ctx[5];
    	validate_each_argument(each_value_2);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks[i] = create_each_block_2$1(get_each_context_2$1(ctx, each_value_2, i));
    	}

    	const block = {
    		c: function create() {
    			section = element("section");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			attr_dev(section, "class", "svelte-192jlo4");
    			add_location(section, file$3, 94, 4, 1606);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, section, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(section, null);
    			}

    			append_dev(section, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*story*/ 1) {
    				each_value_2 = /*section*/ ctx[5];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2$1(ctx, each_value_2, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_2$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(section, t);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_2.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(section);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$2.name,
    		type: "each",
    		source: "(94:2) {#each story.sections as section}",
    		ctx
    	});

    	return block;
    }

    // (107:4) {#each team.people as person}
    function create_each_block$3(ctx) {
    	let div;
    	let img;
    	let img_src_value;
    	let img_alt_value;
    	let t0;
    	let h30;
    	let t1_value = /*person*/ ctx[2].name + "";
    	let t1;
    	let t2;
    	let h31;
    	let t3_value = /*person*/ ctx[2].role + "";
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
    			if (img.src !== (img_src_value = /*person*/ ctx[2].image)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", img_alt_value = `Picture of ${/*person*/ ctx[2].name}`);
    			attr_dev(img, "class", "svelte-192jlo4");
    			add_location(img, file$3, 108, 8, 1925);
    			attr_dev(h30, "class", "team-name svelte-192jlo4");
    			add_location(h30, file$3, 109, 8, 1993);
    			attr_dev(h31, "class", "team-role svelte-192jlo4");
    			add_location(h31, file$3, 110, 8, 2042);
    			attr_dev(div, "class", "team-member svelte-192jlo4");
    			add_location(div, file$3, 107, 6, 1891);
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
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(107:4) {#each team.people as person}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let div0;
    	let h20;
    	let t1;
    	let article0;
    	let header;
    	let blockquote;
    	let t5;
    	let t6;
    	let div1;
    	let h21;
    	let t8;
    	let article1;
    	let div2;
    	let each_value_1 = /*story*/ ctx[0].sections;
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1$2(get_each_context_1$2(ctx, each_value_1, i));
    	}

    	let each_value = /*team*/ ctx[1].people;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$3(get_each_context$3(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			h20 = element("h2");
    			h20.textContent = `${/*story*/ ctx[0].title.toUpperCase()}`;
    			t1 = space();
    			article0 = element("article");
    			header = element("header");
    			blockquote = element("blockquote");
    			blockquote.textContent = `"${/*story*/ ctx[0].heading.toUpperCase()}"`;
    			t5 = space();

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t6 = space();
    			div1 = element("div");
    			h21 = element("h2");
    			h21.textContent = `${/*team*/ ctx[1].title.toUpperCase()}`;
    			t8 = space();
    			article1 = element("article");
    			div2 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(h20, file$3, 85, 2, 1400);
    			attr_dev(div0, "class", "about-title svelte-192jlo4");
    			add_location(div0, file$3, 84, 0, 1372);
    			add_location(blockquote, file$3, 89, 4, 1483);
    			attr_dev(header, "class", "svelte-192jlo4");
    			add_location(header, file$3, 88, 2, 1470);
    			attr_dev(article0, "class", "story svelte-192jlo4");
    			add_location(article0, file$3, 87, 0, 1444);
    			add_location(h21, file$3, 102, 2, 1756);
    			attr_dev(div1, "class", "about-title svelte-192jlo4");
    			add_location(div1, file$3, 101, 0, 1728);
    			attr_dev(div2, "class", "team-wrapper svelte-192jlo4");
    			add_location(div2, file$3, 105, 2, 1824);
    			attr_dev(article1, "class", "team svelte-192jlo4");
    			add_location(article1, file$3, 104, 0, 1799);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, h20);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, article0, anchor);
    			append_dev(article0, header);
    			append_dev(header, blockquote);
    			append_dev(article0, t5);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(article0, null);
    			}

    			insert_dev(target, t6, anchor);
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h21);
    			insert_dev(target, t8, anchor);
    			insert_dev(target, article1, anchor);
    			append_dev(article1, div2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div2, null);
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*story*/ 1) {
    				each_value_1 = /*story*/ ctx[0].sections;
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1$2(ctx, each_value_1, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_1$2(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(article0, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_1.length;
    			}

    			if (dirty & /*team*/ 2) {
    				each_value = /*team*/ ctx[1].people;
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$3(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$3(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div2, null);
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
    			destroy_each(each_blocks_1, detaching);
    			if (detaching) detach_dev(t6);
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t8);
    			if (detaching) detach_dev(article1);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("About", slots, []);
    	const { story, team } = about;
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<About> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ about, story, team });
    	return [story, team];
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

    const { console: console_1$1 } = globals;
    const file$4 = "src/pages/Pricing.svelte";

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[3] = list[i];
    	return child_ctx;
    }

    function get_each_context_1$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	return child_ctx;
    }

    // (177:8) {#if plan.popular}
    function create_if_block_2(ctx) {
    	let h3;
    	let t_value = /*plan*/ ctx[6].popular + "";
    	let t;

    	const block = {
    		c: function create() {
    			h3 = element("h3");
    			t = text(t_value);
    			attr_dev(h3, "class", "popular svelte-ni5m9y");
    			add_location(h3, file$4, 177, 10, 2944);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h3, anchor);
    			append_dev(h3, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h3);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(177:8) {#if plan.popular}",
    		ctx
    	});

    	return block;
    }

    // (182:8) {#if plan.perMonth}
    function create_if_block_1(ctx) {
    	let p;
    	let t_value = /*plan*/ ctx[6].perMonth + "";
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(t_value);
    			attr_dev(p, "class", "perMonth svelte-ni5m9y");
    			add_location(p, file$4, 182, 10, 3124);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(182:8) {#if plan.perMonth}",
    		ctx
    	});

    	return block;
    }

    // (186:8) {#if plan.save}
    function create_if_block$1(ctx) {
    	let h5;
    	let t_value = /*plan*/ ctx[6].save.toUpperCase() + "";
    	let t;

    	const block = {
    		c: function create() {
    			h5 = element("h5");
    			t = text(t_value);
    			attr_dev(h5, "class", "saving svelte-ni5m9y");
    			add_location(h5, file$4, 186, 10, 3261);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h5, anchor);
    			append_dev(h5, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h5);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(186:8) {#if plan.save}",
    		ctx
    	});

    	return block;
    }

    // (175:4) {#each pricing.plans as plan}
    function create_each_block_1$3(ctx) {
    	let div;
    	let t0;
    	let h1;
    	let t1_value = /*plan*/ ctx[6].title + "";
    	let t1;
    	let t2;
    	let h2;
    	let t3_value = /*plan*/ ctx[6].price + "";
    	let t3;
    	let t4;
    	let t5;
    	let p;
    	let t7;
    	let t8;
    	let if_block0 = /*plan*/ ctx[6].popular && create_if_block_2(ctx);
    	let if_block1 = /*plan*/ ctx[6].perMonth && create_if_block_1(ctx);
    	let if_block2 = /*plan*/ ctx[6].save && create_if_block$1(ctx);

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
    			p.textContent = `${pricing.billing}`;
    			t7 = space();
    			if (if_block2) if_block2.c();
    			t8 = space();
    			attr_dev(h1, "class", "title svelte-ni5m9y");
    			add_location(h1, file$4, 179, 8, 3006);
    			attr_dev(h2, "class", "price svelte-ni5m9y");
    			add_location(h2, file$4, 180, 8, 3050);
    			attr_dev(p, "class", "billing svelte-ni5m9y");
    			add_location(p, file$4, 184, 8, 3186);
    			attr_dev(div, "class", "plan svelte-ni5m9y");
    			add_location(div, file$4, 175, 6, 2888);
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
    			append_dev(div, t7);
    			if (if_block2) if_block2.m(div, null);
    			append_dev(div, t8);
    		},
    		p: function update(ctx, dirty) {
    			if (/*plan*/ ctx[6].popular) if_block0.p(ctx, dirty);
    			if (/*plan*/ ctx[6].perMonth) if_block1.p(ctx, dirty);
    			if (/*plan*/ ctx[6].save) if_block2.p(ctx, dirty);
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
    		source: "(175:4) {#each pricing.plans as plan}",
    		ctx
    	});

    	return block;
    }

    // (194:4) {#each pricing.included as included}
    function create_each_block$4(ctx) {
    	let p;
    	let t_value = /*included*/ ctx[3] + "";
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(t_value);
    			attr_dev(p, "class", "svelte-ni5m9y");
    			add_location(p, file$4, 194, 6, 3468);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    			append_dev(p, t);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$4.name,
    		type: "each",
    		source: "(194:4) {#each pricing.included as included}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div0;
    	let h20;
    	let t1;
    	let section;
    	let h21;
    	let t3;
    	let div1;
    	let t4;
    	let div2;
    	let h22;
    	let t6;
    	let t7;
    	let h4;
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
    	let each_value_1 = pricing.plans;
    	validate_each_argument(each_value_1);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks_1[i] = create_each_block_1$3(get_each_context_1$3(ctx, each_value_1, i));
    	}

    	let each_value = pricing.included;
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$4(get_each_context$4(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			h20 = element("h2");
    			h20.textContent = `${pricing.title.toUpperCase()}`;
    			t1 = space();
    			section = element("section");
    			h21 = element("h2");
    			h21.textContent = `${pricing.subscription}`;
    			t3 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t4 = space();
    			div2 = element("div");
    			h22 = element("h2");
    			h22.textContent = `${pricing.whatsIncluded}`;
    			t6 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t7 = space();
    			h4 = element("h4");
    			h4.textContent = `${pricing.available}`;
    			t9 = space();
    			div3 = element("div");
    			button0 = element("button");
    			img0 = element("img");
    			t10 = space();
    			button1 = element("button");
    			img1 = element("img");
    			add_location(h20, file$4, 169, 2, 2706);
    			attr_dev(div0, "class", "pricing-title svelte-ni5m9y");
    			add_location(div0, file$4, 168, 0, 2676);
    			attr_dev(h21, "class", "svelte-ni5m9y");
    			add_location(h21, file$4, 172, 2, 2786);
    			attr_dev(div1, "class", "plans-wrapper svelte-ni5m9y");
    			add_location(div1, file$4, 173, 2, 2820);
    			attr_dev(h22, "class", "svelte-ni5m9y");
    			add_location(h22, file$4, 192, 4, 3388);
    			attr_dev(div2, "class", "included svelte-ni5m9y");
    			add_location(div2, file$4, 191, 2, 3361);
    			attr_dev(h4, "class", "svelte-ni5m9y");
    			add_location(h4, file$4, 197, 2, 3509);
    			attr_dev(img0, "class", "app-icon svelte-ni5m9y");
    			if (img0.src !== (img0_src_value = "images/app-store.png")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "Download on the App Store");
    			add_location(img0, file$4, 202, 6, 3630);
    			attr_dev(button0, "class", "svelte-ni5m9y");
    			add_location(button0, file$4, 199, 4, 3570);
    			attr_dev(img1, "class", "play-icon svelte-ni5m9y");
    			if (img1.src !== (img1_src_value = "images/play-store.png")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "Download on the Play Store");
    			add_location(img1, file$4, 210, 6, 3817);
    			attr_dev(button1, "class", "svelte-ni5m9y");
    			add_location(button1, file$4, 207, 4, 3756);
    			attr_dev(div3, "class", "store-icons svelte-ni5m9y");
    			add_location(div3, file$4, 198, 2, 3540);
    			attr_dev(section, "class", "subscriptions svelte-ni5m9y");
    			add_location(section, file$4, 171, 0, 2752);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, h20);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, section, anchor);
    			append_dev(section, h21);
    			append_dev(section, t3);
    			append_dev(section, div1);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(div1, null);
    			}

    			append_dev(section, t4);
    			append_dev(section, div2);
    			append_dev(div2, h22);
    			append_dev(div2, t6);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div2, null);
    			}

    			append_dev(section, t7);
    			append_dev(section, h4);
    			append_dev(section, t9);
    			append_dev(section, div3);
    			append_dev(div3, button0);
    			append_dev(button0, img0);
    			append_dev(div3, t10);
    			append_dev(div3, button1);
    			append_dev(button1, img1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", /*click_handler*/ ctx[1], false, false, false),
    					listen_dev(button1, "click", /*click_handler_1*/ ctx[2], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*pricing*/ 0) {
    				each_value_1 = pricing.plans;
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

    			if (dirty & /*pricing*/ 0) {
    				each_value = pricing.included;
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
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1$1.warn(`<Pricing> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => openStore("app");
    	const click_handler_1 = () => openStore("play");
    	$$self.$capture_state = () => ({ pricing, openStore });
    	return [openStore, click_handler, click_handler_1];
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
    	let p14;
    	let t52;
    	let details6;
    	let summary6;
    	let t54;
    	let div19;
    	let div18;
    	let img7;
    	let img7_src_value;
    	let t55;
    	let div17;
    	let p15;
    	let t57;
    	let p16;
    	let t59;
    	let section1;
    	let h31;
    	let t61;
    	let details7;
    	let summary7;
    	let t63;
    	let div23;
    	let div20;
    	let img8;
    	let img8_src_value;
    	let t64;
    	let p17;
    	let t66;
    	let div22;
    	let img9;
    	let img9_src_value;
    	let t67;
    	let div21;
    	let p18;
    	let t69;
    	let p19;
    	let t71;
    	let p20;
    	let t73;
    	let p21;
    	let t74;
    	let a0;
    	let t76;
    	let details8;
    	let summary8;
    	let t78;
    	let div27;
    	let div24;
    	let img10;
    	let img10_src_value;
    	let t79;
    	let p22;
    	let t81;
    	let div26;
    	let img11;
    	let img11_src_value;
    	let t82;
    	let div25;
    	let p23;
    	let t84;
    	let p24;
    	let t86;
    	let p25;
    	let t88;
    	let details9;
    	let summary9;
    	let t90;
    	let div28;
    	let p26;
    	let t92;
    	let p27;
    	let t94;
    	let details10;
    	let summary10;
    	let t96;
    	let div31;
    	let div30;
    	let img12;
    	let img12_src_value;
    	let t97;
    	let div29;
    	let p28;
    	let t99;
    	let p29;
    	let t101;
    	let p30;
    	let t103;
    	let details11;
    	let summary11;
    	let t105;
    	let div32;
    	let p31;
    	let t107;
    	let p32;
    	let t109;
    	let details12;
    	let summary12;
    	let t111;
    	let div35;
    	let div34;
    	let img13;
    	let img13_src_value;
    	let t112;
    	let div33;
    	let p33;
    	let t114;
    	let p34;
    	let t116;
    	let p35;
    	let t118;
    	let details13;
    	let summary13;
    	let t120;
    	let div37;
    	let div36;
    	let img14;
    	let img14_src_value;
    	let t121;
    	let p36;
    	let t123;
    	let details14;
    	let summary14;
    	let t125;
    	let div39;
    	let div38;
    	let img15;
    	let img15_src_value;
    	let t126;
    	let p37;
    	let t128;
    	let details15;
    	let summary15;
    	let t130;
    	let div41;
    	let div40;
    	let img16;
    	let img16_src_value;
    	let t131;
    	let p38;
    	let t133;
    	let section2;
    	let h32;
    	let t135;
    	let details16;
    	let summary16;
    	let t137;
    	let div43;
    	let p39;
    	let t139;
    	let div42;
    	let p40;
    	let b0;
    	let t141;
    	let p41;
    	let b1;
    	let t143;
    	let p42;
    	let t145;
    	let details17;
    	let summary17;
    	let t147;
    	let div44;
    	let p43;
    	let t148;
    	let a1;
    	let t150;
    	let t151;
    	let details18;
    	let summary18;
    	let t153;
    	let div47;
    	let p44;
    	let t155;
    	let div46;
    	let img17;
    	let img17_src_value;
    	let t156;
    	let div45;
    	let p45;
    	let t158;
    	let p46;
    	let t160;
    	let p47;
    	let t162;
    	let p48;
    	let t163;
    	let a2;
    	let t165;
    	let t166;
    	let details19;
    	let summary19;
    	let t168;
    	let div48;
    	let p49;
    	let t170;
    	let details20;
    	let summary20;
    	let t172;
    	let div49;
    	let p50;
    	let t173;
    	let a3;
    	let t175;
    	let a4;
    	let t177;

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
    			summary5.textContent = "How do I Submit Feedback?";
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
    			p13.textContent = "On the Settings screen, scroll to the bottom and tap 'Submit Feedback'.";
    			t50 = space();
    			p14 = element("p");
    			p14.textContent = "On the new screen, add your feedback and tap ‘Submit’.";
    			t52 = space();
    			details6 = element("details");
    			summary6 = element("summary");
    			summary6.textContent = "How do I Sign Out? (Android only)";
    			t54 = space();
    			div19 = element("div");
    			div18 = element("div");
    			img7 = element("img");
    			t55 = space();
    			div17 = element("div");
    			p15 = element("p");
    			p15.textContent = "Tap on the Settings button.";
    			t57 = space();
    			p16 = element("p");
    			p16.textContent = "On the Settings screen, scroll to the bottom and tap 'Sign Out'.";
    			t59 = space();
    			section1 = element("section");
    			h31 = element("h3");
    			h31.textContent = "2. Customisation";
    			t61 = space();
    			details7 = element("details");
    			summary7 = element("summary");
    			summary7.textContent = "How do I add custom entry words and images?";
    			t63 = space();
    			div23 = element("div");
    			div20 = element("div");
    			img8 = element("img");
    			t64 = space();
    			p17 = element("p");
    			p17.textContent = "Tap on the Dictionary button.";
    			t66 = space();
    			div22 = element("div");
    			img9 = element("img");
    			t67 = space();
    			div21 = element("div");
    			p18 = element("p");
    			p18.textContent = "Tap 'Add Entry'.";
    			t69 = space();
    			p19 = element("p");
    			p19.textContent = "On this new screen, enter your text, select the category you want your entry to be stored in, and, optionally, choose an image.";
    			t71 = space();
    			p20 = element("p");
    			p20.textContent = "Tap 'Save'.";
    			t73 = space();
    			p21 = element("p");
    			t74 = text("Note: You must only upload content that is yours, or that have been granted the right to use. For more information please see our ");
    			a0 = element("a");
    			a0.textContent = "Terms of Service.";
    			t76 = space();
    			details8 = element("details");
    			summary8 = element("summary");
    			summary8.textContent = "How do I edit or delete custom entry words and images?";
    			t78 = space();
    			div27 = element("div");
    			div24 = element("div");
    			img10 = element("img");
    			t79 = space();
    			p22 = element("p");
    			p22.textContent = "Tap on the Dictionary button.";
    			t81 = space();
    			div26 = element("div");
    			img11 = element("img");
    			t82 = space();
    			div25 = element("div");
    			p23 = element("p");
    			p23.textContent = "Tap on the Word Book button.";
    			t84 = space();
    			p24 = element("p");
    			p24.textContent = "To edit: tap 'Edit' on the entry you want to change. Update the text, category or image, and tap to confirm.";
    			t86 = space();
    			p25 = element("p");
    			p25.textContent = "To delete: tap 'Delete' on the entry you want to delete and tap to confirm.";
    			t88 = space();
    			details9 = element("details");
    			summary9 = element("summary");
    			summary9.textContent = "Are my custom entries safe?";
    			t90 = space();
    			div28 = element("div");
    			p26 = element("p");
    			p26.textContent = "Yes, your custom entries are stored to your personal account. We do not have access to this, nor do we collect or store any of this information.";
    			t92 = space();
    			p27 = element("p");
    			p27.textContent = "Note: for Android users, or those using Lemmi without syncing to iCloud, you will lose any custom data if you delete the app from your device.";
    			t94 = space();
    			details10 = element("details");
    			summary10 = element("summary");
    			summary10.textContent = "How do I change the speaking voice?";
    			t96 = space();
    			div31 = element("div");
    			div30 = element("div");
    			img12 = element("img");
    			t97 = space();
    			div29 = element("div");
    			p28 = element("p");
    			p28.textContent = "Tap on the Settings button.";
    			t99 = space();
    			p29 = element("p");
    			p29.textContent = "Tap on the voice dropdown menu and tap to select a voice.";
    			t101 = space();
    			p30 = element("p");
    			p30.textContent = "To hear a sample voice please tap the 'Play'.";
    			t103 = space();
    			details11 = element("details");
    			summary11 = element("summary");
    			summary11.textContent = "How do I add alternative voices?";
    			t105 = space();
    			div32 = element("div");
    			p31 = element("p");
    			p31.textContent = "For iOS: Go to your device's Settings menu. Select 'Accessibility', then 'Spoken Content' and tap 'Voices'. We recommend using voices marked 'Enhanced'.";
    			t107 = space();
    			p32 = element("p");
    			p32.textContent = "For Android: Go to your device's Settings. Select Accessibility, then tap the 'Preferred Engine Settings' symbol and tap 'Install Voice Data'.";
    			t109 = space();
    			details12 = element("details");
    			summary12 = element("summary");
    			summary12.textContent = "How do I change the app's colour scheme?";
    			t111 = space();
    			div35 = element("div");
    			div34 = element("div");
    			img13 = element("img");
    			t112 = space();
    			div33 = element("div");
    			p33 = element("p");
    			p33.textContent = "Tap on the Settings button, and choose your preferred theme.";
    			t114 = space();
    			p34 = element("p");
    			p34.textContent = "For iOS: toggle 'Dark Mode' on or off.";
    			t116 = space();
    			p35 = element("p");
    			p35.textContent = "For Android: choose between 'Light', 'Dark', and 'Default' modes. Selecting 'Default' will tell Lemmi to follow your device's settings.";
    			t118 = space();
    			details13 = element("details");
    			summary13 = element("summary");
    			summary13.textContent = "How do I turn off the Auto Speak option?";
    			t120 = space();
    			div37 = element("div");
    			div36 = element("div");
    			img14 = element("img");
    			t121 = space();
    			p36 = element("p");
    			p36.textContent = "Tap on the Settings button, then turn ‘Auto Speak’ off.";
    			t123 = space();
    			details14 = element("details");
    			summary14 = element("summary");
    			summary14.textContent = "How do I hide Suggested Words?";
    			t125 = space();
    			div39 = element("div");
    			div38 = element("div");
    			img15 = element("img");
    			t126 = space();
    			p37 = element("p");
    			p37.textContent = "Tap on the Settings button, then turn ‘Show Suggested Words’ off.";
    			t128 = space();
    			details15 = element("details");
    			summary15 = element("summary");
    			summary15.textContent = "How do I hide Images and just have text?";
    			t130 = space();
    			div41 = element("div");
    			div40 = element("div");
    			img16 = element("img");
    			t131 = space();
    			p38 = element("p");
    			p38.textContent = "Tap on the Settings button, then turn ‘Show Images' off.";
    			t133 = space();
    			section2 = element("section");
    			h32 = element("h3");
    			h32.textContent = "3. Subscriptions";
    			t135 = space();
    			details16 = element("details");
    			summary16 = element("summary");
    			summary16.textContent = "How much does Lemmi cost?";
    			t137 = space();
    			div43 = element("div");
    			p39 = element("p");
    			p39.textContent = "Lemmi is a subscription based app with two payment options:";
    			t139 = space();
    			div42 = element("div");
    			p40 = element("p");
    			b0 = element("b");
    			b0.textContent = "Yearly – users pay £41.99 per year (£3.50 per month, saving 22%)";
    			t141 = space();
    			p41 = element("p");
    			b1 = element("b");
    			b1.textContent = "Monthly – users pay £4.49 per month on a rolling contract";
    			t143 = space();
    			p42 = element("p");
    			p42.textContent = "Note: Both options come with a 7-day FREE trial and you can upgrade your subscription at any time.";
    			t145 = space();
    			details17 = element("details");
    			summary17 = element("summary");
    			summary17.textContent = "Do you offer any discounts?";
    			t147 = space();
    			div44 = element("div");
    			p43 = element("p");
    			t148 = text("We occasionally run promotions, to hear about these special discounts please sign up to our Newsletter ");
    			a1 = element("a");
    			a1.textContent = "at the bottom of the screen";
    			t150 = text(".");
    			t151 = space();
    			details18 = element("details");
    			summary18 = element("summary");
    			summary18.textContent = "How do I manage or cancel my subscription renewal?";
    			t153 = space();
    			div47 = element("div");
    			p44 = element("p");
    			p44.textContent = "You can manage your subscription directly through your iCloud or Play Store account, or within the Lemmi app itself.";
    			t155 = space();
    			div46 = element("div");
    			img17 = element("img");
    			t156 = space();
    			div45 = element("div");
    			p45 = element("p");
    			p45.textContent = "Tap on the Settings button.";
    			t158 = space();
    			p46 = element("p");
    			p46.textContent = "Scroll down to the bottom of the page and tap 'Manage Subscription'.";
    			t160 = space();
    			p47 = element("p");
    			p47.textContent = "This will take you to the relevant Store.";
    			t162 = space();
    			p48 = element("p");
    			t163 = text("Note: You will not receive a refund for the fees you have already paid for your current subscription period, but you will have access to the service until the end of your current subscription period. For more information, please refer to Lemmi's ");
    			a2 = element("a");
    			a2.textContent = "Terms of Service";
    			t165 = text(".");
    			t166 = space();
    			details19 = element("details");
    			summary19 = element("summary");
    			summary19.textContent = "How do I install a pre-existing subscription onto a new device?";
    			t168 = space();
    			div48 = element("div");
    			p49 = element("p");
    			p49.textContent = "Ensure you are using the same iCloud or Play Store account. Re-download Lemmi onto your new device and use the ‘Restore previous purchase’ when you open Lemmi for the first time.";
    			t170 = space();
    			details20 = element("details");
    			summary20 = element("summary");
    			summary20.textContent = "Important information";
    			t172 = space();
    			div49 = element("div");
    			p50 = element("p");
    			t173 = text("By using Lemmi you agree that you have read, understood, and agreed to Lemmi's ");
    			a3 = element("a");
    			a3.textContent = "Terms of Service";
    			t175 = text(" and ");
    			a4 = element("a");
    			a4.textContent = "Privacy Policy";
    			t177 = text(".");
    			add_location(h2, file$5, 91, 2, 1486);
    			attr_dev(div0, "class", "faq-title svelte-1srjqp7");
    			add_location(div0, file$5, 90, 0, 1460);
    			attr_dev(h30, "class", "svelte-1srjqp7");
    			add_location(h30, file$5, 94, 2, 1539);
    			attr_dev(summary0, "class", "svelte-1srjqp7");
    			add_location(summary0, file$5, 96, 4, 1579);
    			attr_dev(p0, "class", "svelte-1srjqp7");
    			add_location(p0, file$5, 98, 6, 1659);
    			attr_dev(p1, "class", "svelte-1srjqp7");
    			add_location(p1, file$5, 99, 6, 1734);
    			attr_dev(p2, "class", "svelte-1srjqp7");
    			add_location(p2, file$5, 100, 6, 1881);
    			attr_dev(div1, "class", "details-wrapper svelte-1srjqp7");
    			add_location(div1, file$5, 97, 4, 1623);
    			attr_dev(details0, "class", "svelte-1srjqp7");
    			add_location(details0, file$5, 95, 2, 1565);
    			attr_dev(summary1, "class", "svelte-1srjqp7");
    			add_location(summary1, file$5, 104, 4, 2002);
    			if (img0.src !== (img0_src_value = "images/clear.png")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "clear icon");
    			attr_dev(img0, "class", "svelte-1srjqp7");
    			add_location(img0, file$5, 107, 8, 2130);
    			attr_dev(p3, "class", "svelte-1srjqp7");
    			add_location(p3, file$5, 108, 8, 2186);
    			attr_dev(div2, "class", "iconed-text svelte-1srjqp7");
    			add_location(div2, file$5, 106, 6, 2096);
    			if (img1.src !== (img1_src_value = "images/undo.png")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "undo icon");
    			attr_dev(img1, "class", "svelte-1srjqp7");
    			add_location(img1, file$5, 111, 8, 2287);
    			attr_dev(p4, "class", "svelte-1srjqp7");
    			add_location(p4, file$5, 112, 8, 2340);
    			attr_dev(div3, "class", "iconed-text svelte-1srjqp7");
    			add_location(div3, file$5, 110, 6, 2253);
    			if (img2.src !== (img2_src_value = "images/play.png")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "alt", "play icon");
    			attr_dev(img2, "class", "svelte-1srjqp7");
    			add_location(img2, file$5, 115, 8, 2465);
    			attr_dev(p5, "class", "svelte-1srjqp7");
    			add_location(p5, file$5, 116, 8, 2518);
    			attr_dev(div4, "class", "iconed-text svelte-1srjqp7");
    			add_location(div4, file$5, 114, 6, 2431);
    			attr_dev(div5, "class", "details-wrapper svelte-1srjqp7");
    			add_location(div5, file$5, 105, 4, 2060);
    			attr_dev(details1, "class", "svelte-1srjqp7");
    			add_location(details1, file$5, 103, 2, 1988);
    			attr_dev(summary2, "class", "svelte-1srjqp7");
    			add_location(summary2, file$5, 121, 4, 2617);
    			if (img3.src !== (img3_src_value = "images/core.png")) attr_dev(img3, "src", img3_src_value);
    			attr_dev(img3, "alt", "core icon");
    			attr_dev(img3, "class", "svelte-1srjqp7");
    			add_location(img3, file$5, 124, 8, 2738);
    			attr_dev(p6, "class", "svelte-1srjqp7");
    			add_location(p6, file$5, 126, 10, 2836);
    			attr_dev(p7, "class", "svelte-1srjqp7");
    			add_location(p7, file$5, 127, 10, 2925);
    			attr_dev(p8, "class", "svelte-1srjqp7");
    			add_location(p8, file$5, 128, 10, 3010);
    			attr_dev(div6, "class", "iconed-text-wrapper svelte-1srjqp7");
    			add_location(div6, file$5, 125, 8, 2792);
    			attr_dev(div7, "class", "iconed-text svelte-1srjqp7");
    			add_location(div7, file$5, 123, 6, 2704);
    			attr_dev(div8, "class", "details-wrapper svelte-1srjqp7");
    			add_location(div8, file$5, 122, 4, 2668);
    			attr_dev(details2, "class", "svelte-1srjqp7");
    			add_location(details2, file$5, 120, 2, 2603);
    			attr_dev(summary3, "class", "svelte-1srjqp7");
    			add_location(summary3, file$5, 134, 4, 3142);
    			if (img4.src !== (img4_src_value = "images/dictionary.png")) attr_dev(img4, "src", img4_src_value);
    			attr_dev(img4, "alt", "dictionary icon");
    			attr_dev(img4, "class", "svelte-1srjqp7");
    			add_location(img4, file$5, 137, 8, 3263);
    			attr_dev(p9, "class", "svelte-1srjqp7");
    			add_location(p9, file$5, 138, 8, 3329);
    			attr_dev(div9, "class", "iconed-text svelte-1srjqp7");
    			add_location(div9, file$5, 136, 6, 3229);
    			attr_dev(div10, "class", "details-wrapper svelte-1srjqp7");
    			add_location(div10, file$5, 135, 4, 3193);
    			attr_dev(details3, "class", "svelte-1srjqp7");
    			add_location(details3, file$5, 133, 2, 3128);
    			attr_dev(summary4, "class", "svelte-1srjqp7");
    			add_location(summary4, file$5, 143, 4, 3451);
    			if (img5.src !== (img5_src_value = "images/settings.png")) attr_dev(img5, "src", img5_src_value);
    			attr_dev(img5, "alt", "settings icon");
    			attr_dev(img5, "class", "svelte-1srjqp7");
    			add_location(img5, file$5, 146, 8, 3570);
    			attr_dev(p10, "class", "svelte-1srjqp7");
    			add_location(p10, file$5, 148, 10, 3676);
    			attr_dev(p11, "class", "svelte-1srjqp7");
    			add_location(p11, file$5, 149, 10, 3721);
    			attr_dev(div11, "class", "iconed-text-wrapper svelte-1srjqp7");
    			add_location(div11, file$5, 147, 8, 3632);
    			attr_dev(div12, "class", "iconed-text svelte-1srjqp7");
    			add_location(div12, file$5, 145, 6, 3536);
    			attr_dev(div13, "class", "details-wrapper svelte-1srjqp7");
    			add_location(div13, file$5, 144, 4, 3500);
    			attr_dev(details4, "class", "svelte-1srjqp7");
    			add_location(details4, file$5, 142, 2, 3437);
    			attr_dev(summary5, "class", "svelte-1srjqp7");
    			add_location(summary5, file$5, 155, 4, 3868);
    			if (img6.src !== (img6_src_value = "images/settings.png")) attr_dev(img6, "src", img6_src_value);
    			attr_dev(img6, "alt", "settings icon");
    			attr_dev(img6, "class", "svelte-1srjqp7");
    			add_location(img6, file$5, 158, 8, 3987);
    			attr_dev(p12, "class", "svelte-1srjqp7");
    			add_location(p12, file$5, 160, 10, 4093);
    			attr_dev(p13, "class", "svelte-1srjqp7");
    			add_location(p13, file$5, 161, 10, 4138);
    			attr_dev(p14, "class", "svelte-1srjqp7");
    			add_location(p14, file$5, 162, 10, 4227);
    			attr_dev(div14, "class", "iconed-text-wrapper svelte-1srjqp7");
    			add_location(div14, file$5, 159, 8, 4049);
    			attr_dev(div15, "class", "iconed-text svelte-1srjqp7");
    			add_location(div15, file$5, 157, 6, 3953);
    			attr_dev(div16, "class", "details-wrapper svelte-1srjqp7");
    			add_location(div16, file$5, 156, 4, 3917);
    			attr_dev(details5, "class", "svelte-1srjqp7");
    			add_location(details5, file$5, 154, 2, 3854);
    			attr_dev(summary6, "class", "svelte-1srjqp7");
    			add_location(summary6, file$5, 168, 4, 4357);
    			if (img7.src !== (img7_src_value = "images/settings.png")) attr_dev(img7, "src", img7_src_value);
    			attr_dev(img7, "alt", "settings icon");
    			attr_dev(img7, "class", "svelte-1srjqp7");
    			add_location(img7, file$5, 171, 8, 4484);
    			attr_dev(p15, "class", "svelte-1srjqp7");
    			add_location(p15, file$5, 173, 10, 4590);
    			attr_dev(p16, "class", "svelte-1srjqp7");
    			add_location(p16, file$5, 174, 10, 4635);
    			attr_dev(div17, "class", "iconed-text-wrapper svelte-1srjqp7");
    			add_location(div17, file$5, 172, 8, 4546);
    			attr_dev(div18, "class", "iconed-text svelte-1srjqp7");
    			add_location(div18, file$5, 170, 6, 4450);
    			attr_dev(div19, "class", "details-wrapper svelte-1srjqp7");
    			add_location(div19, file$5, 169, 4, 4414);
    			attr_dev(details6, "class", "svelte-1srjqp7");
    			add_location(details6, file$5, 167, 2, 4343);
    			attr_dev(section0, "class", "faq-section svelte-1srjqp7");
    			add_location(section0, file$5, 93, 0, 1507);
    			attr_dev(h31, "class", "svelte-1srjqp7");
    			add_location(h31, file$5, 181, 2, 4802);
    			attr_dev(summary7, "class", "svelte-1srjqp7");
    			add_location(summary7, file$5, 183, 4, 4844);
    			if (img8.src !== (img8_src_value = "images/dictionary.png")) attr_dev(img8, "src", img8_src_value);
    			attr_dev(img8, "alt", "dictionary icon");
    			attr_dev(img8, "class", "svelte-1srjqp7");
    			add_location(img8, file$5, 186, 8, 4981);
    			attr_dev(p17, "class", "svelte-1srjqp7");
    			add_location(p17, file$5, 187, 8, 5047);
    			attr_dev(div20, "class", "iconed-text svelte-1srjqp7");
    			add_location(div20, file$5, 185, 6, 4947);
    			if (img9.src !== (img9_src_value = "images/add.png")) attr_dev(img9, "src", img9_src_value);
    			attr_dev(img9, "alt", "add entry icon");
    			attr_dev(img9, "class", "svelte-1srjqp7");
    			add_location(img9, file$5, 190, 8, 5137);
    			attr_dev(p18, "class", "svelte-1srjqp7");
    			add_location(p18, file$5, 192, 10, 5239);
    			attr_dev(p19, "class", "svelte-1srjqp7");
    			add_location(p19, file$5, 193, 10, 5273);
    			attr_dev(p20, "class", "svelte-1srjqp7");
    			add_location(p20, file$5, 194, 10, 5418);
    			attr_dev(div21, "class", "iconed-text-wrapper svelte-1srjqp7");
    			add_location(div21, file$5, 191, 8, 5195);
    			attr_dev(div22, "class", "iconed-text svelte-1srjqp7");
    			add_location(div22, file$5, 189, 6, 5103);
    			attr_dev(a0, "href", "/terms-of-service.html");
    			add_location(a0, file$5, 197, 139, 5604);
    			attr_dev(p21, "class", "svelte-1srjqp7");
    			add_location(p21, file$5, 197, 6, 5471);
    			attr_dev(div23, "class", "details-wrapper svelte-1srjqp7");
    			add_location(div23, file$5, 184, 4, 4911);
    			attr_dev(details7, "class", "svelte-1srjqp7");
    			add_location(details7, file$5, 182, 2, 4830);
    			attr_dev(summary8, "class", "svelte-1srjqp7");
    			add_location(summary8, file$5, 201, 4, 5703);
    			if (img10.src !== (img10_src_value = "images/dictionary.png")) attr_dev(img10, "src", img10_src_value);
    			attr_dev(img10, "alt", "dictionary icon");
    			attr_dev(img10, "class", "svelte-1srjqp7");
    			add_location(img10, file$5, 204, 8, 5851);
    			attr_dev(p22, "class", "svelte-1srjqp7");
    			add_location(p22, file$5, 205, 8, 5917);
    			attr_dev(div24, "class", "iconed-text svelte-1srjqp7");
    			add_location(div24, file$5, 203, 6, 5817);
    			if (img11.src !== (img11_src_value = "images/word-book.png")) attr_dev(img11, "src", img11_src_value);
    			attr_dev(img11, "alt", "word book icon");
    			attr_dev(img11, "class", "svelte-1srjqp7");
    			add_location(img11, file$5, 208, 8, 6007);
    			attr_dev(p23, "class", "svelte-1srjqp7");
    			add_location(p23, file$5, 210, 10, 6115);
    			attr_dev(p24, "class", "svelte-1srjqp7");
    			add_location(p24, file$5, 211, 10, 6161);
    			attr_dev(p25, "class", "svelte-1srjqp7");
    			add_location(p25, file$5, 212, 10, 6287);
    			attr_dev(div25, "class", "iconed-text-wrapper svelte-1srjqp7");
    			add_location(div25, file$5, 209, 8, 6071);
    			attr_dev(div26, "class", "iconed-text svelte-1srjqp7");
    			add_location(div26, file$5, 207, 6, 5973);
    			attr_dev(div27, "class", "details-wrapper svelte-1srjqp7");
    			add_location(div27, file$5, 202, 4, 5781);
    			attr_dev(details8, "class", "svelte-1srjqp7");
    			add_location(details8, file$5, 200, 2, 5689);
    			attr_dev(summary9, "class", "svelte-1srjqp7");
    			add_location(summary9, file$5, 218, 4, 6438);
    			attr_dev(p26, "class", "svelte-1srjqp7");
    			add_location(p26, file$5, 220, 6, 6525);
    			attr_dev(p27, "class", "svelte-1srjqp7");
    			add_location(p27, file$5, 221, 6, 6683);
    			attr_dev(div28, "class", "details-wrapper svelte-1srjqp7");
    			add_location(div28, file$5, 219, 4, 6489);
    			attr_dev(details9, "class", "svelte-1srjqp7");
    			add_location(details9, file$5, 217, 2, 6424);
    			attr_dev(summary10, "class", "svelte-1srjqp7");
    			add_location(summary10, file$5, 225, 4, 6873);
    			if (img12.src !== (img12_src_value = "images/settings.png")) attr_dev(img12, "src", img12_src_value);
    			attr_dev(img12, "alt", "settings icon");
    			attr_dev(img12, "class", "svelte-1srjqp7");
    			add_location(img12, file$5, 228, 8, 7002);
    			attr_dev(p28, "class", "svelte-1srjqp7");
    			add_location(p28, file$5, 230, 10, 7108);
    			attr_dev(p29, "class", "svelte-1srjqp7");
    			add_location(p29, file$5, 231, 10, 7153);
    			attr_dev(p30, "class", "svelte-1srjqp7");
    			add_location(p30, file$5, 232, 10, 7229);
    			attr_dev(div29, "class", "iconed-text-wrapper svelte-1srjqp7");
    			add_location(div29, file$5, 229, 8, 7064);
    			attr_dev(div30, "class", "iconed-text svelte-1srjqp7");
    			add_location(div30, file$5, 227, 6, 6968);
    			attr_dev(div31, "class", "details-wrapper svelte-1srjqp7");
    			add_location(div31, file$5, 226, 4, 6932);
    			attr_dev(details10, "class", "svelte-1srjqp7");
    			add_location(details10, file$5, 224, 2, 6859);
    			attr_dev(summary11, "class", "svelte-1srjqp7");
    			add_location(summary11, file$5, 238, 4, 7350);
    			attr_dev(p31, "class", "svelte-1srjqp7");
    			add_location(p31, file$5, 240, 6, 7442);
    			attr_dev(p32, "class", "svelte-1srjqp7");
    			add_location(p32, file$5, 241, 6, 7608);
    			attr_dev(div32, "class", "details-wrapper svelte-1srjqp7");
    			add_location(div32, file$5, 239, 4, 7406);
    			attr_dev(details11, "class", "svelte-1srjqp7");
    			add_location(details11, file$5, 237, 2, 7336);
    			attr_dev(summary12, "class", "svelte-1srjqp7");
    			add_location(summary12, file$5, 245, 4, 7798);
    			if (img13.src !== (img13_src_value = "images/settings.png")) attr_dev(img13, "src", img13_src_value);
    			attr_dev(img13, "alt", "settings icon");
    			attr_dev(img13, "class", "svelte-1srjqp7");
    			add_location(img13, file$5, 248, 8, 7932);
    			attr_dev(p33, "class", "svelte-1srjqp7");
    			add_location(p33, file$5, 250, 10, 8038);
    			attr_dev(p34, "class", "svelte-1srjqp7");
    			add_location(p34, file$5, 251, 10, 8116);
    			attr_dev(p35, "class", "svelte-1srjqp7");
    			add_location(p35, file$5, 252, 10, 8172);
    			attr_dev(div33, "class", "iconed-text-wrapper svelte-1srjqp7");
    			add_location(div33, file$5, 249, 8, 7994);
    			attr_dev(div34, "class", "iconed-text svelte-1srjqp7");
    			add_location(div34, file$5, 247, 6, 7898);
    			attr_dev(div35, "class", "details-wrapper svelte-1srjqp7");
    			add_location(div35, file$5, 246, 4, 7862);
    			attr_dev(details12, "class", "svelte-1srjqp7");
    			add_location(details12, file$5, 244, 2, 7784);
    			attr_dev(summary13, "class", "svelte-1srjqp7");
    			add_location(summary13, file$5, 258, 4, 8383);
    			if (img14.src !== (img14_src_value = "images/settings.png")) attr_dev(img14, "src", img14_src_value);
    			attr_dev(img14, "alt", "settings icon");
    			attr_dev(img14, "class", "svelte-1srjqp7");
    			add_location(img14, file$5, 261, 8, 8517);
    			attr_dev(p36, "class", "svelte-1srjqp7");
    			add_location(p36, file$5, 262, 8, 8579);
    			attr_dev(div36, "class", "iconed-text svelte-1srjqp7");
    			add_location(div36, file$5, 260, 6, 8483);
    			attr_dev(div37, "class", "details-wrapper svelte-1srjqp7");
    			add_location(div37, file$5, 259, 4, 8447);
    			attr_dev(details13, "class", "svelte-1srjqp7");
    			add_location(details13, file$5, 257, 2, 8369);
    			attr_dev(summary14, "class", "svelte-1srjqp7");
    			add_location(summary14, file$5, 267, 4, 8695);
    			if (img15.src !== (img15_src_value = "images/settings.png")) attr_dev(img15, "src", img15_src_value);
    			attr_dev(img15, "alt", "settings icon");
    			attr_dev(img15, "class", "svelte-1srjqp7");
    			add_location(img15, file$5, 270, 8, 8819);
    			attr_dev(p37, "class", "svelte-1srjqp7");
    			add_location(p37, file$5, 271, 8, 8881);
    			attr_dev(div38, "class", "iconed-text svelte-1srjqp7");
    			add_location(div38, file$5, 269, 6, 8785);
    			attr_dev(div39, "class", "details-wrapper svelte-1srjqp7");
    			add_location(div39, file$5, 268, 4, 8749);
    			attr_dev(details14, "class", "svelte-1srjqp7");
    			add_location(details14, file$5, 266, 2, 8681);
    			attr_dev(summary15, "class", "svelte-1srjqp7");
    			add_location(summary15, file$5, 276, 4, 9007);
    			if (img16.src !== (img16_src_value = "images/settings.png")) attr_dev(img16, "src", img16_src_value);
    			attr_dev(img16, "alt", "settings icon");
    			attr_dev(img16, "class", "svelte-1srjqp7");
    			add_location(img16, file$5, 279, 8, 9141);
    			attr_dev(p38, "class", "svelte-1srjqp7");
    			add_location(p38, file$5, 280, 8, 9203);
    			attr_dev(div40, "class", "iconed-text svelte-1srjqp7");
    			add_location(div40, file$5, 278, 6, 9107);
    			attr_dev(div41, "class", "details-wrapper svelte-1srjqp7");
    			add_location(div41, file$5, 277, 4, 9071);
    			attr_dev(details15, "class", "svelte-1srjqp7");
    			add_location(details15, file$5, 275, 2, 8993);
    			attr_dev(section1, "class", "faq-section svelte-1srjqp7");
    			add_location(section1, file$5, 180, 0, 4770);
    			attr_dev(h32, "class", "svelte-1srjqp7");
    			add_location(h32, file$5, 286, 2, 9347);
    			attr_dev(summary16, "class", "svelte-1srjqp7");
    			add_location(summary16, file$5, 288, 4, 9389);
    			attr_dev(p39, "class", "svelte-1srjqp7");
    			add_location(p39, file$5, 290, 6, 9474);
    			add_location(b0, file$5, 292, 11, 9564);
    			attr_dev(p40, "class", "svelte-1srjqp7");
    			add_location(p40, file$5, 292, 8, 9561);
    			add_location(b1, file$5, 293, 11, 9651);
    			attr_dev(p41, "class", "svelte-1srjqp7");
    			add_location(p41, file$5, 293, 8, 9648);
    			add_location(div42, file$5, 291, 6, 9547);
    			attr_dev(p42, "class", "svelte-1srjqp7");
    			add_location(p42, file$5, 295, 6, 9739);
    			attr_dev(div43, "class", "details-wrapper svelte-1srjqp7");
    			add_location(div43, file$5, 289, 4, 9438);
    			attr_dev(details16, "class", "svelte-1srjqp7");
    			add_location(details16, file$5, 287, 2, 9375);
    			attr_dev(summary17, "class", "svelte-1srjqp7");
    			add_location(summary17, file$5, 299, 4, 9885);
    			attr_dev(a1, "href", "#footer");
    			add_location(a1, file$5, 301, 112, 10078);
    			attr_dev(p43, "class", "svelte-1srjqp7");
    			add_location(p43, file$5, 301, 6, 9972);
    			attr_dev(div44, "class", "details-wrapper svelte-1srjqp7");
    			add_location(div44, file$5, 300, 4, 9936);
    			attr_dev(details17, "class", "svelte-1srjqp7");
    			add_location(details17, file$5, 298, 2, 9871);
    			attr_dev(summary18, "class", "svelte-1srjqp7");
    			add_location(summary18, file$5, 305, 4, 10173);
    			attr_dev(p44, "class", "svelte-1srjqp7");
    			add_location(p44, file$5, 307, 6, 10283);
    			if (img17.src !== (img17_src_value = "images/settings.png")) attr_dev(img17, "src", img17_src_value);
    			attr_dev(img17, "alt", "settings icon");
    			attr_dev(img17, "class", "svelte-1srjqp7");
    			add_location(img17, file$5, 309, 8, 10447);
    			attr_dev(p45, "class", "svelte-1srjqp7");
    			add_location(p45, file$5, 311, 10, 10553);
    			attr_dev(p46, "class", "svelte-1srjqp7");
    			add_location(p46, file$5, 312, 10, 10598);
    			attr_dev(p47, "class", "svelte-1srjqp7");
    			add_location(p47, file$5, 313, 10, 10684);
    			attr_dev(div45, "class", "iconed-text-wrapper svelte-1srjqp7");
    			add_location(div45, file$5, 310, 8, 10509);
    			attr_dev(div46, "class", "iconed-text svelte-1srjqp7");
    			add_location(div46, file$5, 308, 6, 10413);
    			attr_dev(a2, "href", "/terms-of-service.html");
    			add_location(a2, file$5, 316, 255, 11016);
    			attr_dev(p48, "class", "svelte-1srjqp7");
    			add_location(p48, file$5, 316, 6, 10767);
    			attr_dev(div47, "class", "details-wrapper svelte-1srjqp7");
    			add_location(div47, file$5, 306, 4, 10247);
    			attr_dev(details18, "class", "svelte-1srjqp7");
    			add_location(details18, file$5, 304, 2, 10159);
    			attr_dev(summary19, "class", "svelte-1srjqp7");
    			add_location(summary19, file$5, 320, 4, 11115);
    			attr_dev(p49, "class", "svelte-1srjqp7");
    			add_location(p49, file$5, 322, 6, 11238);
    			attr_dev(div48, "class", "details-wrapper svelte-1srjqp7");
    			add_location(div48, file$5, 321, 4, 11202);
    			attr_dev(details19, "class", "svelte-1srjqp7");
    			add_location(details19, file$5, 319, 2, 11101);
    			attr_dev(summary20, "class", "svelte-1srjqp7");
    			add_location(summary20, file$5, 326, 4, 11464);
    			attr_dev(a3, "href", "/terms-of-service.html");
    			add_location(a3, file$5, 328, 88, 11627);
    			attr_dev(a4, "href", "/privacy-policy.html");
    			add_location(a4, file$5, 328, 146, 11685);
    			attr_dev(p50, "class", "svelte-1srjqp7");
    			add_location(p50, file$5, 328, 6, 11545);
    			attr_dev(div49, "class", "details-wrapper svelte-1srjqp7");
    			add_location(div49, file$5, 327, 4, 11509);
    			attr_dev(details20, "class", "svelte-1srjqp7");
    			add_location(details20, file$5, 325, 2, 11450);
    			attr_dev(section2, "class", "faq-section svelte-1srjqp7");
    			add_location(section2, file$5, 285, 0, 9315);
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
    			append_dev(div14, t50);
    			append_dev(div14, p14);
    			append_dev(section0, t52);
    			append_dev(section0, details6);
    			append_dev(details6, summary6);
    			append_dev(details6, t54);
    			append_dev(details6, div19);
    			append_dev(div19, div18);
    			append_dev(div18, img7);
    			append_dev(div18, t55);
    			append_dev(div18, div17);
    			append_dev(div17, p15);
    			append_dev(div17, t57);
    			append_dev(div17, p16);
    			insert_dev(target, t59, anchor);
    			insert_dev(target, section1, anchor);
    			append_dev(section1, h31);
    			append_dev(section1, t61);
    			append_dev(section1, details7);
    			append_dev(details7, summary7);
    			append_dev(details7, t63);
    			append_dev(details7, div23);
    			append_dev(div23, div20);
    			append_dev(div20, img8);
    			append_dev(div20, t64);
    			append_dev(div20, p17);
    			append_dev(div23, t66);
    			append_dev(div23, div22);
    			append_dev(div22, img9);
    			append_dev(div22, t67);
    			append_dev(div22, div21);
    			append_dev(div21, p18);
    			append_dev(div21, t69);
    			append_dev(div21, p19);
    			append_dev(div21, t71);
    			append_dev(div21, p20);
    			append_dev(div23, t73);
    			append_dev(div23, p21);
    			append_dev(p21, t74);
    			append_dev(p21, a0);
    			append_dev(section1, t76);
    			append_dev(section1, details8);
    			append_dev(details8, summary8);
    			append_dev(details8, t78);
    			append_dev(details8, div27);
    			append_dev(div27, div24);
    			append_dev(div24, img10);
    			append_dev(div24, t79);
    			append_dev(div24, p22);
    			append_dev(div27, t81);
    			append_dev(div27, div26);
    			append_dev(div26, img11);
    			append_dev(div26, t82);
    			append_dev(div26, div25);
    			append_dev(div25, p23);
    			append_dev(div25, t84);
    			append_dev(div25, p24);
    			append_dev(div25, t86);
    			append_dev(div25, p25);
    			append_dev(section1, t88);
    			append_dev(section1, details9);
    			append_dev(details9, summary9);
    			append_dev(details9, t90);
    			append_dev(details9, div28);
    			append_dev(div28, p26);
    			append_dev(div28, t92);
    			append_dev(div28, p27);
    			append_dev(section1, t94);
    			append_dev(section1, details10);
    			append_dev(details10, summary10);
    			append_dev(details10, t96);
    			append_dev(details10, div31);
    			append_dev(div31, div30);
    			append_dev(div30, img12);
    			append_dev(div30, t97);
    			append_dev(div30, div29);
    			append_dev(div29, p28);
    			append_dev(div29, t99);
    			append_dev(div29, p29);
    			append_dev(div29, t101);
    			append_dev(div29, p30);
    			append_dev(section1, t103);
    			append_dev(section1, details11);
    			append_dev(details11, summary11);
    			append_dev(details11, t105);
    			append_dev(details11, div32);
    			append_dev(div32, p31);
    			append_dev(div32, t107);
    			append_dev(div32, p32);
    			append_dev(section1, t109);
    			append_dev(section1, details12);
    			append_dev(details12, summary12);
    			append_dev(details12, t111);
    			append_dev(details12, div35);
    			append_dev(div35, div34);
    			append_dev(div34, img13);
    			append_dev(div34, t112);
    			append_dev(div34, div33);
    			append_dev(div33, p33);
    			append_dev(div33, t114);
    			append_dev(div33, p34);
    			append_dev(div33, t116);
    			append_dev(div33, p35);
    			append_dev(section1, t118);
    			append_dev(section1, details13);
    			append_dev(details13, summary13);
    			append_dev(details13, t120);
    			append_dev(details13, div37);
    			append_dev(div37, div36);
    			append_dev(div36, img14);
    			append_dev(div36, t121);
    			append_dev(div36, p36);
    			append_dev(section1, t123);
    			append_dev(section1, details14);
    			append_dev(details14, summary14);
    			append_dev(details14, t125);
    			append_dev(details14, div39);
    			append_dev(div39, div38);
    			append_dev(div38, img15);
    			append_dev(div38, t126);
    			append_dev(div38, p37);
    			append_dev(section1, t128);
    			append_dev(section1, details15);
    			append_dev(details15, summary15);
    			append_dev(details15, t130);
    			append_dev(details15, div41);
    			append_dev(div41, div40);
    			append_dev(div40, img16);
    			append_dev(div40, t131);
    			append_dev(div40, p38);
    			insert_dev(target, t133, anchor);
    			insert_dev(target, section2, anchor);
    			append_dev(section2, h32);
    			append_dev(section2, t135);
    			append_dev(section2, details16);
    			append_dev(details16, summary16);
    			append_dev(details16, t137);
    			append_dev(details16, div43);
    			append_dev(div43, p39);
    			append_dev(div43, t139);
    			append_dev(div43, div42);
    			append_dev(div42, p40);
    			append_dev(p40, b0);
    			append_dev(div42, t141);
    			append_dev(div42, p41);
    			append_dev(p41, b1);
    			append_dev(div43, t143);
    			append_dev(div43, p42);
    			append_dev(section2, t145);
    			append_dev(section2, details17);
    			append_dev(details17, summary17);
    			append_dev(details17, t147);
    			append_dev(details17, div44);
    			append_dev(div44, p43);
    			append_dev(p43, t148);
    			append_dev(p43, a1);
    			append_dev(p43, t150);
    			append_dev(section2, t151);
    			append_dev(section2, details18);
    			append_dev(details18, summary18);
    			append_dev(details18, t153);
    			append_dev(details18, div47);
    			append_dev(div47, p44);
    			append_dev(div47, t155);
    			append_dev(div47, div46);
    			append_dev(div46, img17);
    			append_dev(div46, t156);
    			append_dev(div46, div45);
    			append_dev(div45, p45);
    			append_dev(div45, t158);
    			append_dev(div45, p46);
    			append_dev(div45, t160);
    			append_dev(div45, p47);
    			append_dev(div47, t162);
    			append_dev(div47, p48);
    			append_dev(p48, t163);
    			append_dev(p48, a2);
    			append_dev(p48, t165);
    			append_dev(section2, t166);
    			append_dev(section2, details19);
    			append_dev(details19, summary19);
    			append_dev(details19, t168);
    			append_dev(details19, div48);
    			append_dev(div48, p49);
    			append_dev(section2, t170);
    			append_dev(section2, details20);
    			append_dev(details20, summary20);
    			append_dev(details20, t172);
    			append_dev(details20, div49);
    			append_dev(div49, p50);
    			append_dev(p50, t173);
    			append_dev(p50, a3);
    			append_dev(p50, t175);
    			append_dev(p50, a4);
    			append_dev(p50, t177);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(section0);
    			if (detaching) detach_dev(t59);
    			if (detaching) detach_dev(section1);
    			if (detaching) detach_dev(t133);
    			if (detaching) detach_dev(section2);
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

    function instance$5($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("FAQs", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<FAQs> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ About });
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

    // (155:8) {#if success}
    function create_if_block_1$1(ctx) {
    	let p;
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(/*success*/ ctx[4]);
    			attr_dev(p, "class", "success svelte-1v6c191");
    			add_location(p, file$6, 155, 10, 2727);
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
    		source: "(155:8) {#if success}",
    		ctx
    	});

    	return block;
    }

    // (158:8) {#if error}
    function create_if_block$2(ctx) {
    	let p;
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(/*error*/ ctx[5]);
    			attr_dev(p, "class", "error svelte-1v6c191");
    			add_location(p, file$6, 158, 10, 2804);
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
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(158:8) {#if error}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let div0;
    	let h2;
    	let t1;
    	let section;
    	let p0;
    	let t3;
    	let div6;
    	let div5;
    	let div1;
    	let h3;
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
    	let t21;
    	let p1;
    	let mounted;
    	let dispose;
    	let if_block0 = /*success*/ ctx[4] && create_if_block_1$1(ctx);
    	let if_block1 = /*error*/ ctx[5] && create_if_block$2(ctx);

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			h2 = element("h2");
    			h2.textContent = `${contact.title.toUpperCase()}`;
    			t1 = space();
    			section = element("section");
    			p0 = element("p");
    			p0.textContent = `${contact.instructions}`;
    			t3 = space();
    			div6 = element("div");
    			div5 = element("div");
    			div1 = element("div");
    			h3 = element("h3");
    			h3.textContent = `${contact.form}`;
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
    			button.textContent = `${contact.submit.toUpperCase()}`;
    			t21 = space();
    			p1 = element("p");
    			p1.textContent = `${contact.notes}`;
    			add_location(h2, file$6, 146, 2, 2475);
    			attr_dev(div0, "class", "contact-title svelte-1v6c191");
    			add_location(div0, file$6, 145, 0, 2445);
    			attr_dev(p0, "class", "svelte-1v6c191");
    			add_location(p0, file$6, 149, 2, 2549);
    			attr_dev(h3, "class", "svelte-1v6c191");
    			add_location(h3, file$6, 153, 8, 2671);
    			attr_dev(div1, "class", "form-header svelte-1v6c191");
    			add_location(div1, file$6, 152, 6, 2637);
    			attr_dev(label0, "for", "first-name");
    			add_location(label0, file$6, 164, 12, 2946);
    			attr_dev(input0, "id", "first-name");
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "autocomplete", "name");
    			input0.required = true;
    			attr_dev(input0, "class", "svelte-1v6c191");
    			add_location(input0, file$6, 165, 12, 3003);
    			attr_dev(div2, "class", "svelte-1v6c191");
    			add_location(div2, file$6, 163, 10, 2928);
    			attr_dev(label1, "for", "last-name");
    			add_location(label1, file$6, 174, 12, 3242);
    			attr_dev(input1, "id", "last-name");
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "autocomplete", "additional-name");
    			attr_dev(input1, "class", "svelte-1v6c191");
    			add_location(input1, file$6, 175, 12, 3296);
    			attr_dev(div3, "class", "svelte-1v6c191");
    			add_location(div3, file$6, 173, 10, 3224);
    			attr_dev(div4, "class", "name svelte-1v6c191");
    			add_location(div4, file$6, 162, 8, 2899);
    			attr_dev(label2, "for", "email");
    			add_location(label2, file$6, 183, 8, 3516);
    			attr_dev(input2, "type", "email");
    			attr_dev(input2, "id", "email");
    			input2.required = true;
    			attr_dev(input2, "autocomplete", "email");
    			attr_dev(input2, "class", "svelte-1v6c191");
    			add_location(input2, file$6, 184, 8, 3559);
    			attr_dev(label3, "for", "message");
    			add_location(label3, file$6, 191, 8, 3734);
    			attr_dev(textarea, "id", "message");
    			textarea.required = true;
    			attr_dev(textarea, "class", "svelte-1v6c191");
    			add_location(textarea, file$6, 192, 8, 3781);
    			attr_dev(form, "id", "contact-form");
    			attr_dev(form, "class", "svelte-1v6c191");
    			add_location(form, file$6, 161, 6, 2866);
    			attr_dev(button, "class", "svelte-1v6c191");
    			add_location(button, file$6, 198, 6, 3921);
    			attr_dev(div5, "class", "form-wrapper svelte-1v6c191");
    			add_location(div5, file$6, 151, 4, 2604);
    			attr_dev(div6, "class", "form svelte-1v6c191");
    			add_location(div6, file$6, 150, 2, 2581);
    			attr_dev(p1, "class", "svelte-1v6c191");
    			add_location(p1, file$6, 201, 2, 4015);
    			attr_dev(section, "class", "contact svelte-1v6c191");
    			add_location(section, file$6, 148, 0, 2521);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, h2);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, section, anchor);
    			append_dev(section, p0);
    			append_dev(section, t3);
    			append_dev(section, div6);
    			append_dev(div6, div5);
    			append_dev(div5, div1);
    			append_dev(div1, h3);
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
    			append_dev(section, t21);
    			append_dev(section, p1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input0, "change", /*change_handler*/ ctx[7], false, false, false),
    					listen_dev(input1, "change", /*change_handler_1*/ ctx[8], false, false, false),
    					listen_dev(input2, "change", /*change_handler_2*/ ctx[9], false, false, false),
    					listen_dev(textarea, "change", /*change_handler_3*/ ctx[10], false, false, false),
    					listen_dev(button, "click", /*handleSubmit*/ ctx[6], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
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
    					if_block1 = create_if_block$2(ctx);
    					if_block1.c();
    					if_block1.m(div1, null);
    				}
    			} else if (if_block1) {
    				if_block1.d(1);
    				if_block1 = null;
    			}
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Contact", slots, []);
    	let first, last, email, feedback, success, error;

    	async function handleSubmit(e) {
    		const url = "https://bize978r9h.execute-api.us-east-2.amazonaws.com/Production/contact";

    		const res = await fetch(url, {
    			method: "POST",
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
    		contact,
    		first,
    		last,
    		email,
    		feedback,
    		success,
    		error,
    		handleSubmit
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

    // (170:6) {:else}
    function create_else_block(ctx) {
    	let t0;
    	let div;
    	let input;
    	let t1;
    	let button;
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
    			button.textContent = `${/*newsletter*/ ctx[3].button.toUpperCase()}`;
    			attr_dev(input, "id", "newletter");
    			attr_dev(input, "name", "newletter");
    			attr_dev(input, "type", "email");
    			attr_dev(input, "placeholder", "EMAIL ADDRESS");
    			attr_dev(input, "aria-label", "Newsletter Sign Up");
    			input.required = true;
    			attr_dev(input, "class", "svelte-g15j5k");
    			add_location(input, file$7, 174, 8, 3277);
    			attr_dev(button, "id", "submit");
    			attr_dev(button, "class", "submit svelte-g15j5k");
    			add_location(button, file$7, 183, 8, 3533);
    			attr_dev(div, "class", "subscribe svelte-g15j5k");
    			add_location(div, file$7, 173, 6, 3245);
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div, anchor);
    			append_dev(div, input);
    			set_input_value(input, /*email*/ ctx[0]);
    			append_dev(div, t1);
    			append_dev(div, button);

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
    		source: "(170:6) {:else}",
    		ctx
    	});

    	return block;
    }

    // (168:6) {#if newsletterMsg && newsletterSuccess}
    function create_if_block$3(ctx) {
    	let p;
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(/*newsletterMsg*/ ctx[2]);
    			attr_dev(p, "class", "message");
    			toggle_class(p, "success", /*newsletterSuccess*/ ctx[1]);
    			add_location(p, file$7, 168, 8, 3045);
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
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(168:6) {#if newsletterMsg && newsletterSuccess}",
    		ctx
    	});

    	return block;
    }

    // (171:6) {#if newsletterMsg && !newsletterSuccess}
    function create_if_block_1$2(ctx) {
    	let p;
    	let t;

    	const block = {
    		c: function create() {
    			p = element("p");
    			t = text(/*newsletterMsg*/ ctx[2]);
    			attr_dev(p, "class", "message");
    			add_location(p, file$7, 171, 8, 3188);
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
    		source: "(171:6) {#if newsletterMsg && !newsletterSuccess}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$7(ctx) {
    	let footer;
    	let div6;
    	let div0;
    	let p0;
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
    		if (/*newsletterMsg*/ ctx[2] && /*newsletterSuccess*/ ctx[1]) return create_if_block$3;
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
    			p0.textContent = `${/*newsletter*/ ctx[3].heading}`;
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
    			p2.textContent = "In loving memory of N. Lemmikki Hyry";
    			t10 = space();
    			div4 = element("div");
    			div3 = element("div");
    			a4 = element("a");
    			a4.textContent = "Privacy Policy";
    			t12 = space();
    			a5 = element("a");
    			a5.textContent = "Terms of Service";
    			attr_dev(p0, "class", "heading");
    			add_location(p0, file$7, 166, 6, 2946);
    			attr_dev(div0, "class", "subscribe-wrapper svelte-g15j5k");
    			add_location(div0, file$7, 165, 4, 2908);
    			attr_dev(img0, "class", "social-icon svelte-g15j5k");
    			if (img0.src !== (img0_src_value = "images/email.svg")) attr_dev(img0, "src", img0_src_value);
    			attr_dev(img0, "alt", "social-icon");
    			add_location(img0, file$7, 191, 6, 3780);
    			attr_dev(a0, "href", a0_href_value = links.email);
    			attr_dev(a0, "rel", "noopener");
    			attr_dev(a0, "target", "_blank");
    			add_location(a0, file$7, 190, 4, 3720);
    			attr_dev(img1, "class", "social-icon svelte-g15j5k");
    			if (img1.src !== (img1_src_value = "images/twitter.svg")) attr_dev(img1, "src", img1_src_value);
    			attr_dev(img1, "alt", "social-icon");
    			add_location(img1, file$7, 194, 6, 3924);
    			attr_dev(a1, "href", a1_href_value = links.twitter);
    			attr_dev(a1, "rel", "noopener");
    			attr_dev(a1, "target", "_blank");
    			add_location(a1, file$7, 193, 4, 3862);
    			attr_dev(img2, "class", "social-icon svelte-g15j5k");
    			if (img2.src !== (img2_src_value = "images/facebook.svg")) attr_dev(img2, "src", img2_src_value);
    			attr_dev(img2, "alt", "social-icon");
    			add_location(img2, file$7, 197, 6, 4071);
    			attr_dev(a2, "href", a2_href_value = links.facebook);
    			attr_dev(a2, "rel", "noopener");
    			attr_dev(a2, "target", "_blank");
    			add_location(a2, file$7, 196, 4, 4008);
    			attr_dev(img3, "class", "social-icon svelte-g15j5k");
    			if (img3.src !== (img3_src_value = "images/instagram.svg")) attr_dev(img3, "src", img3_src_value);
    			attr_dev(img3, "alt", "social-icon");
    			add_location(img3, file$7, 200, 6, 4220);
    			attr_dev(a3, "href", a3_href_value = links.instagram);
    			attr_dev(a3, "rel", "noopener");
    			attr_dev(a3, "target", "_blank");
    			add_location(a3, file$7, 199, 4, 4156);
    			attr_dev(div1, "class", "social-links svelte-g15j5k");
    			add_location(div1, file$7, 189, 2, 3689);
    			attr_dev(p1, "class", "svelte-g15j5k");
    			add_location(p1, file$7, 205, 6, 4373);
    			attr_dev(div2, "class", "copywrite svelte-g15j5k");
    			add_location(div2, file$7, 204, 4, 4343);
    			attr_dev(p2, "class", "memorial svelte-g15j5k");
    			add_location(p2, file$7, 207, 4, 4430);
    			attr_dev(a4, "href", "/privacy-policy.html");
    			attr_dev(a4, "class", "svelte-g15j5k");
    			add_location(a4, file$7, 210, 8, 4567);
    			attr_dev(a5, "href", "/terms-of-service.html");
    			attr_dev(a5, "class", "svelte-g15j5k");
    			add_location(a5, file$7, 211, 8, 4625);
    			attr_dev(div3, "class", "navigation svelte-g15j5k");
    			add_location(div3, file$7, 209, 6, 4534);
    			attr_dev(div4, "class", "navigation-wrapper svelte-g15j5k");
    			add_location(div4, file$7, 208, 4, 4495);
    			attr_dev(div5, "class", "small-print svelte-g15j5k");
    			add_location(div5, file$7, 203, 2, 4313);
    			attr_dev(div6, "class", "footer-content svelte-g15j5k");
    			add_location(div6, file$7, 164, 2, 2875);
    			attr_dev(footer, "id", "footer");
    			attr_dev(footer, "class", "svelte-g15j5k");
    			add_location(footer, file$7, 163, 0, 2852);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, footer, anchor);
    			append_dev(footer, div6);
    			append_dev(div6, div0);
    			append_dev(div0, p0);
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Footer", slots, []);
    	const { newsletter } = actions;
    	let email;
    	let successMsg = newsletter.success;
    	let newsletterSuccess = false;
    	let newsletterMsg;

    	async function handleSubmit() {
    		const url = "https://bize978r9h.execute-api.us-east-2.amazonaws.com/Production/join-newsletter";

    		const res = await fetch(url, {
    			method: "POST",
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
    		actions,
    		links,
    		newsletter,
    		email,
    		successMsg,
    		newsletterSuccess,
    		newsletterMsg,
    		handleSubmit,
    		onInputChange
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
    		newsletter,
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

    function create_fragment$8(ctx) {
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
    				handleClickNavigation: /*handleClickNavigation*/ ctx[2]
    			},
    			$$inline: true
    		});

    	var switch_value = /*components*/ ctx[1][/*page*/ ctx[0]];

    	function switch_props(ctx) {
    		return {
    			props: {
    				handleClickNavigation: /*handleClickNavigation*/ ctx[2]
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
    			add_location(main, file$8, 27, 0, 753);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
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
    		p: function update(ctx, [dirty]) {
    			const header_changes = {};
    			if (dirty & /*page*/ 1) header_changes.page = /*page*/ ctx[0];
    			header.$set(header_changes);

    			if (switch_value !== (switch_value = /*components*/ ctx[1][/*page*/ ctx[0]])) {
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
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);

    	const components = {
    		[pages.home]: Home,
    		[pages.app]: Lemmi,
    		[pages.about]: About,
    		[pages.pricing]: Pricing,
    		[pages.faqs]: FAQs,
    		[pages.contact]: Contact
    	};

    	let page = pages.home;

    	let handleClickNavigation = selected => {
    		$$invalidate(0, page = selected);
    	};

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
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
    		handleClickNavigation
    	});

    	$$self.$inject_state = $$props => {
    		if ("page" in $$props) $$invalidate(0, page = $$props.page);
    		if ("handleClickNavigation" in $$props) $$invalidate(2, handleClickNavigation = $$props.handleClickNavigation);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [page, components, handleClickNavigation];
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

    const app$1 = new App({
      target: document.body
    });

    return app$1;

}());
//# sourceMappingURL=bundle.js.map
