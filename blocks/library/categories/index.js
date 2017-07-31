/**
 * WordPress dependencies
 */
import { Component } from 'element';
import { Placeholder, Spinner } from 'components';
import { __ } from 'i18n';

/**
 * Internal dependencies
 */
import './style.scss';
import './block.scss';
import { registerBlockType } from '../../api';
import { getCategories } from './data.js';
import InspectorControls from '../../inspector-controls';
import ToggleControl from '../../inspector-controls/toggle-control';
import BlockDescription from '../../block-description';
import BlockControls from '../../block-controls';
import BlockAlignmentToolbar from '../../block-alignment-toolbar';

registerBlockType( 'core/categories', {
	title: __( 'Categories' ),

	icon: 'list-view',

	category: 'widgets',

	defaultAttributes: {
		showPostCounts: false,
		displayAsDropdown: false,
		showHierarchy: false,
	},

	getEditWrapperProps( attributes ) {
		const { align } = attributes;
		if ( 'left' === align || 'right' === align || 'full' === align ) {
			return { 'data-align': align };
		}
	},

	edit: class extends Component {
		constructor() {
			super( ...arguments );

			this.state = {
				categories: [],
			};

			this.categoriesRequest = getCategories();

			this.categoriesRequest
				.then( categories => this.setState( { categories } ) );

			this.toggleDisplayAsDropdown = this.toggleDisplayAsDropdown.bind( this );
			this.toggleShowPostCounts = this.toggleShowPostCounts.bind( this );
			this.toggleShowHierarchy = this.toggleShowHierarchy.bind( this );
		}

		toggleDisplayAsDropdown() {
			const { displayAsDropdown } = this.props.attributes;
			const { setAttributes } = this.props;

			setAttributes( { displayAsDropdown: ! displayAsDropdown } );
		}

		toggleShowPostCounts() {
			const { showPostCounts } = this.props.attributes;
			const { setAttributes } = this.props;

			setAttributes( { showPostCounts: ! showPostCounts } );
		}

		toggleShowHierarchy() {
			const { showHierarchy } = this.props.attributes;
			const { setAttributes } = this.props;

			setAttributes( { showHierarchy: ! showHierarchy } );
		}

		getCategories( parentId = null ) {
			const { categories } = this.state;
			if ( ! categories.length ) {
				return [];
			}

			if ( parentId === null ) {
				return categories;
			}

			return categories.filter( category => category.parent === parentId );
		}

		getCategoryListClassName( level ) {
			const { className } = this.props;
			return `${ className }__list ${ className }__list-level-${ level }`;
		}

		renderCategoryList() {
			const { showHierarchy } = this.props.attributes;
			const parentId = showHierarchy ? 0 : null;
			const categories = this.getCategories( parentId );

			return (
				<ul className={ this.getCategoryListClassName( 0 ) }>
					{ categories.map( category => this.renderCategoryListItem( category, 0 ) ) }
				</ul>
			);
		}

		renderCategoryListItem( category, level ) {
			const { showHierarchy, showPostCounts } = this.props.attributes;
			const childCategories = this.getCategories( category.id );

			return (
				<li key={ category.id }>
					<a href={ category.link } target="_blank">{ category.name.trim() || __( '(Untitled)' ) }</a>
					{ showPostCounts &&
						<span className={ `${ this.props.className }__post-count` }>
							{ ' ' }({ category.count })
						</span>
					}

					{
						showHierarchy &&
						!! childCategories.length && (
							<ul className={ this.getCategoryListClassName( level + 1 ) }>
								{ childCategories.map( childCategory => this.renderCategoryListItem( childCategory, level + 1 ) ) }
							</ul>
						)
					}
				</li>
			);
		}

		renderCategoryDropdown() {
			const { showHierarchy } = this.props.attributes;
			const parentId = showHierarchy ? 0 : null;
			const categories = this.getCategories( parentId );

			return (
				<select className={ `${ this.props.className }__dropdown` }>
					{ categories.map( category => this.renderCategoryDropdownItem( category, 0 ) ) }
				</select>
			);
		}

		renderCategoryDropdownItem( category, level ) {
			const { showHierarchy, showPostCounts } = this.props.attributes;
			const childCategories = this.getCategories( category.id );

			return [
				<option key={ category.id }>
					{ new Array( level * 3 ).fill( '\xa0' ) }
					{ category.name.trim() || __( '(Untitled)' ) }
					{
						!! showPostCounts
							? ` ( ${ category.count } )`
							: ''
					}
				</option>,
				showHierarchy &&
				!! childCategories.length && (
					childCategories.map( childCategory => this.renderCategoryDropdownItem( childCategory, level + 1 ) )
				),
			];
		}

		render() {
			const { setAttributes } = this.props;
			const categories = this.getCategories();

			if ( ! categories.length ) {
				return (
					<Placeholder
						icon="admin-post"
						label={ __( 'Categories' ) }
					>
						<Spinner />
					</Placeholder>
				);
			}

			const { focus } = this.props;
			const { align, displayAsDropdown, showHierarchy, showPostCounts } = this.props.attributes;

			return [
				focus && (
					<BlockControls key="controls">
						<BlockAlignmentToolbar
							value={ align }
							onChange={ ( nextAlign ) => {
								setAttributes( { align: nextAlign } );
							} }
							controls={ [ 'left', 'center', 'right', 'full' ] }
						/>
					</BlockControls>
				),
				focus && (
					<InspectorControls key="inspector">
						<BlockDescription>
							<p>{ __( 'Shows a list of your site\'s categories.' ) }</p>
						</BlockDescription>
						<h3>{ __( 'Categories Settings' ) }</h3>
						<ToggleControl
							label={ __( 'Display as dropdown' ) }
							checked={ displayAsDropdown }
							onChange={ this.toggleDisplayAsDropdown }
						/>
						<ToggleControl
							label={ __( 'Show post counts' ) }
							checked={ showPostCounts }
							onChange={ this.toggleShowPostCounts }
						/>
						<ToggleControl
							label={ __( 'Show hierarchy' ) }
							checked={ showHierarchy }
							onChange={ this.toggleShowHierarchy }
						/>
					</InspectorControls>
				),
				<div key="categories" className={ this.props.className }>
					{
						displayAsDropdown
							? this.renderCategoryDropdown()
							: this.renderCategoryList()
					}
				</div>,
			];
		}

		componentWillUnmount() {
			if ( this.categoriesRequest.state() === 'pending' ) {
				this.categoriesRequest.abort();
			}
		}
	},

	save() {
		return null;
	},
} );
